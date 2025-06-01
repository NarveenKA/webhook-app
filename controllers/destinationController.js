// /controllers/destinationController.js

const { v4: uuidv4 } = require('uuid');
const Destination = require('../models/destination');
const Account = require('../models/account');

// Helper function for consistent error responses
const sendErrorResponse = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      timestamp: new Date().toISOString(),
      code: statusCode
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return res.status(statusCode).json(response);
};

// Helper function for consistent success responses
const sendSuccessResponse = (res, statusCode, data, message = null) => {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
};

// Validate UUID format
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Validate UUID format
const isValidID = (id) => {
  const positiveIntegerRegex = /^\d+$/;
  return positiveIntegerRegex.test(id);
};

// Validate URL format
const isValidURL = (url) => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch (error) {
    return false;
  }
};

// Validate HTTP method
const isValidHttpMethod = (method) => {
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  return validMethods.includes(method.toUpperCase());
};

// Validate headers object
const validateHeaders = (headers) => {
  const errors = [];
  
  if (typeof headers !== 'object' || headers === null) {
    errors.push('Headers must be a valid object');
    return errors;
  }
  
  if (Array.isArray(headers)) {
    errors.push('Headers must be an object, not an array');
    return errors;
  }
  
  // Validate header names and values
  Object.entries(headers).forEach(([key, value]) => {
    if (typeof key !== 'string' || key.trim() === '') {
      errors.push(`Invalid header name: "${key}"`);
    }
    
    if (typeof value !== 'string' && typeof value !== 'number') {
      errors.push(`Invalid header value for "${key}": must be string or number`);
    }
    
    // Check for restricted headers
    const restrictedHeaders = ['host', 'content-length', 'connection'];
    if (restrictedHeaders.includes(key.toLowerCase())) {
      errors.push(`Restricted header "${key}" cannot be set manually`);
    }
  });
  
  return errors;
};

// Input validation for create/update
const validateDestinationInput = (req, isUpdate = false) => {
  const { account_id, url, http_method, headers } = req.body;
  const errors = [];
  
  // Required field validation for create
  if (!isUpdate) {
    if (!account_id) {
      errors.push('Account ID is required');
    } else if (!isValidUUID(account_id)) {
      errors.push('Invalid account ID format');
    }
    
    if (!url) {
      errors.push('URL is required');
    }
    
    if (!http_method) {
      errors.push('HTTP method is required');
    }
    
    if (!headers) {
      errors.push('Headers are required');
    }
  }
  
  // Field validation (for both create and update)
  if (account_id && !isValidUUID(account_id)) {
    errors.push('Invalid account ID format');
  }
  
  if (url && !isValidURL(url)) {
    errors.push('Invalid URL format - must be a valid HTTP/HTTPS URL');
  }
  
  if (http_method && !isValidHttpMethod(http_method)) {
    errors.push('Invalid HTTP method - must be one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
  }
  
  if (headers) {
    const headerErrors = validateHeaders(headers);
    errors.push(...headerErrors);
  }
  
  return errors;
};

module.exports = {
  // POST /destinations - Create new destination
async create(req, res) {
    try {
      // Input validation
      const validationErrors = validateDestinationInput(req);
      if (validationErrors.length > 0) {
        return sendErrorResponse(res, 400, 'Validation failed', validationErrors);
      }
      
      const { account_id, url, http_method, headers } = req.body;
      
      // Verify account exists
      const account = await Account.findById(account_id);
      if (!account) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      // Check for duplicate destination (same account + url + method)
      const existingDestinations = await Destination.findByAccountId(account_id);
      const duplicate = existingDestinations.find(dest => 
        dest.url === url.trim() && 
        dest.http_method.toLowerCase() === http_method.toLowerCase()
      );
      
      if (duplicate) {
        return sendErrorResponse(res, 409, 'Destination with same URL and HTTP method already exists for this account');
      }
      
      // Create destination - using headers as object (not stringified) since table uses JSON type
      const destination = {
        // Don't include 'id' - it's auto-increment
        account_id,
        url: url.trim(),
        http_method: http_method.toUpperCase(),
        headers: headers || {}, // Use object directly, not JSON.stringify
        // Don't include timestamps - they're handled by knex timestamps(true, true)
      };
      
      await Destination.create(destination);
      
      // Return the created destination directly (headers already parsed as object)
      return sendSuccessResponse(res, 201, destination, 'Destination created successfully');
      
    } catch (error) {
      
      if (error.code === 'SQLITE_CONSTRAINT' || error.code === 11000) {
        return sendErrorResponse(res, 409, 'Destination already exists');
      }
      return sendErrorResponse(res, 500, 'Internal server error while creating destination');
    }
  },

  // GET /destinations/account/:account_id - Get destinations by account ID
  async getByAccountId(req, res) {
    try {
      const { account_id } = req.params;
      
      // Validate account ID format
      if (!isValidUUID(account_id)) {
        return sendErrorResponse(res, 400, 'Invalid account ID format');
      }
      
      // Verify account exists
      const account = await Account.findById(account_id);
      if (!account) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      // Get destinations with pagination support
      const { page = 1, limit = 10, active_only } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let destinations = await Destination.findByAccountId(account_id, {
        limit: parseInt(limit),
        offset,
        activeOnly: active_only === 'true'
      });
      
      // Parse headers for better readability
      destinations = destinations.map(dest => ({
        ...dest,
        headers: typeof dest.headers === 'string' ? JSON.parse(dest.headers) : dest.headers
      }));
      
      return sendSuccessResponse(res, 200, {
        destinations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: destinations.length,
          account_id
        }
      });
      
    } catch (error) {
      return sendErrorResponse(res, 500, 'Internal server error while fetching destinations');
    }
  },

  // GET /destinations/:id - Get destination by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      // Validate destination ID format
      if (!isValidID(id)) {
        return sendErrorResponse(res, 400, 'Invalid destination ID');
      }
      
      const destination = await Destination.findById(id);
      if (!destination) {
        return sendErrorResponse(res, 404, 'Destination not found');
      }
      
      // Parse headers for better readability
      const responseDestination = {
        ...destination,
        headers: typeof destination.headers === 'string' ? 
          JSON.parse(destination.headers) : destination.headers
      };
      
      return sendSuccessResponse(res, 200, responseDestination);
      
    } catch (error) {
      return sendErrorResponse(res, 500, 'Internal server error while fetching destination');
    }
  },

  // PUT /destinations/:id - Update destination

  async update(req, res) {
  try {
    const { id } = req.params;
    
    // Validate destination ID format (now it's a number, not UUID)
    if (!isValidID(id)) {
      return sendErrorResponse(res, 400, 'Invalid destination ID');
    }
    
    // Check if destination exists
    const existingDestination = await Destination.findById(parseInt(id));
    if (!existingDestination) {
      return sendErrorResponse(res, 404, 'Destination not found');
    }
    
    // Validate update data
    const validationErrors = validateDestinationInput(req, true);
    if (validationErrors.length > 0) {
      return sendErrorResponse(res, 400, 'Validation failed', validationErrors);
    }
    
    // Prepare update data
    const allowedFields = ['url', 'http_method', 'headers'];
    const updateData = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'headers') {
          // Store as object directly (JSON type in database)
          updateData[key] = req.body[key] || {};
        } else if (key === 'http_method') {
          updateData[key] = req.body[key].toUpperCase();
        } else if (key === 'url') {
          updateData[key] = req.body[key].trim();
        } else {
          updateData[key] = req.body[key];
        }
      }
    });
    
    if (Object.keys(updateData).length === 0) {
      return sendErrorResponse(res, 400, 'No valid fields provided for update', {
        allowed_fields: allowedFields
      });
    }
    
    // Check for duplicate if URL or method is being updated
    if (updateData.url || updateData.http_method) {
      const checkUrl = updateData.url || existingDestination.url;
      const checkMethod = updateData.http_method || existingDestination.http_method;
      
      const accountDestinations = await Destination.findByAccountId(existingDestination.account_id);
      const duplicate = accountDestinations.find(dest => 
        dest.id !== parseInt(id) && // Use 'id' instead of 'destination_id'
        dest.url === checkUrl && 
        dest.http_method.toLowerCase() === checkMethod.toLowerCase()
      );
      
      if (duplicate) {
        return sendErrorResponse(res, 409, 'Destination with same URL and HTTP method already exists for this account');
      }
    }
    
    // Don't manually set updated_at - knex timestamps handles this automatically
    
    const updated = await Destination.update(parseInt(id), updateData);
    if (!updated) {
      return sendErrorResponse(res, 404, 'Destination not found');
    }
    
    // Fetch and return updated destination
    const updatedDestination = await Destination.findById(parseInt(id));
    
    // Return destination directly (headers already parsed as object from JSON field)
    return sendSuccessResponse(res, 200, updatedDestination, 'Destination updated successfully');
    
  } catch (error) {
    console.error('Error in destination update:', error);
    console.error('Error stack:', error.stack);
    return sendErrorResponse(res, 500, 'Internal server error while updating destination');
  }
},

  // DELETE /destinations/:id - Delete destination
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      if (!isValidID(id)) {
        return sendErrorResponse(res, 400, 'Invalid destination ID');
      }
      
      // Check if destination exists
      const existingDestination = await Destination.findById(id);
      if (!existingDestination) {
        return sendErrorResponse(res, 404, 'Destination not found');
      }
      
      const deleted = await Destination.delete(id);
      if (!deleted) {
        return sendErrorResponse(res, 404, 'Destination not found');
      }
      
      return sendSuccessResponse(res, 200, {
        deleted_destination_id: id,
        deleted_at: new Date().toISOString()
      }, 'Destination deleted successfully');
      
    } catch (error) {
      return sendErrorResponse(res, 500, 'Internal server error while deleting destination');
    }
  },
};