// /controllers/dataHandlerController.js

const Account = require('../models/account');
const Destination = require('../models/destination');
const axios = require('axios');
const qs = require('qs');

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

// Validate incoming data
const validateIncomingData = (data) => {
  const errors = [];
  
  if (!data) {
    errors.push('Request body is required');
    return errors;
  }
  
  if (typeof data !== 'object') {
    errors.push('Request body must be a valid JSON object');
    return errors;
  }
  
  if (Array.isArray(data)) {
    errors.push('Request body must be an object, not an array');
    return errors;
  }
  
  if (Object.keys(data).length === 0) {
    errors.push('Request body cannot be empty');
    return errors;
  }
  
  return errors;
};

// Validate destination configuration
const validateDestination = (destination) => {
  const errors = [];
  
  if (!destination.url) {
    errors.push(`Destination ${destination.destination_id}: URL is required`);
  } else {
    try {
      new URL(destination.url);
    } catch (error) {
      errors.push(`Destination ${destination.destination_id}: Invalid URL format`);
    }
  }
  
  if (!destination.http_method) {
    errors.push(`Destination ${destination.destination_id}: HTTP method is required`);
  } else {
    const validMethods = ['get', 'post', 'put', 'patch', 'delete'];
    if (!validMethods.includes(destination.http_method.toLowerCase())) {
      errors.push(`Destination ${destination.destination_id}: Invalid HTTP method`);
    }
  }
  
  if (destination.headers) {
    try {
      JSON.parse(destination.headers);
    } catch (error) {
      errors.push(`Destination ${destination.destination_id}: Invalid headers format`);
    }
  }
  
  return errors;
};

// Send data to a single destination with retry logic
const sendToDestination = async (destination, data, retries = 2) => {
  const { url, http_method, headers: headersStr, destination_id } = destination;
  
  let headers = {};
  try {
    headers = headersStr ? JSON.parse(headersStr) : {};
  } catch (error) {
    throw new Error(`Invalid headers format for destination ${destination_id}`);
  }
  
  // Add default headers
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  headers['User-Agent'] = headers['User-Agent'] || 'DataHandler-Webhook/1.0';
  
  const method = http_method.toLowerCase();
  const requestConfig = {
    method,
    url,
    headers,
    timeout: 30000, // 30 seconds timeout
    validateStatus: (status) => status < 500, // Don't throw on 4xx errors
  };
  
  // Configure request based on method
  if (method === 'get') {
    requestConfig.params = data;
    requestConfig.paramsSerializer = params => qs.stringify(params, { arrayFormat: 'brackets' });
  } else if (['post', 'put', 'patch'].includes(method)) {
    requestConfig.data = data;
  }
  
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios(requestConfig);
      
      return {
        destination_id,
        url,
        method: method.toUpperCase(),
        status: response.status,
        success: response.status < 400,
        response_time: Date.now(),
        attempt: attempt + 1
      };
      
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  // If we get here, all attempts failed
  const errorDetails = {
    destination_id,
    url,
    method: method.toUpperCase(),
    success: false,
    attempts: retries + 1,
    error: lastError.response ? {
      status: lastError.response.status,
      statusText: lastError.response.statusText,
      data: lastError.response.data
    } : {
      message: lastError.message,
      code: lastError.code
    }
  };
  
  return errorDetails;
};

module.exports = {
  // POST /server/webhook - Receive and forward data
  async receiveData(req, res) {
    const startTime = Date.now();
    
    try {
      // Validate authentication token
      const token = req.headers['cl-x-token'];
      
      if (!token) {
        return sendErrorResponse(res, 401, 'Authentication token is required', {
          header: 'cl-x-token header is missing'
        });
      }
      
      if (typeof token !== 'string' || token.trim().length === 0) {
        return sendErrorResponse(res, 401, 'Invalid authentication token format');
      }
      
      // Find account by token
      const account = await Account.findByToken(token.trim());
      if (!account) {
        return sendErrorResponse(res, 401, 'Invalid or expired authentication token');
      }
      
      // Validate incoming data
      const data = req.body;
      const dataValidationErrors = validateIncomingData(data);
      if (dataValidationErrors.length > 0) {
        return sendErrorResponse(res, 400, 'Invalid request data', dataValidationErrors);
      }
      
      // Get destinations for the account
      const destinations = await Destination.findByAccountId(account.account_id);
      
      if (!destinations || destinations.length === 0) {
        return sendSuccessResponse(res, 200, {
          account_id: account.account_id,
          destinations_count: 0,
          processing_time_ms: Date.now() - startTime
        }, 'No destinations configured for this account');
      }
      
      // Validate all destinations before processing
      const destinationErrors = [];
      destinations.forEach(dest => {
        const errors = validateDestination(dest);
        destinationErrors.push(...errors);
      });
      
      if (destinationErrors.length > 0) {
        return sendErrorResponse(res, 422, 'Destination configuration errors', destinationErrors);
      }
      
      // Process all destinations concurrently
      const deliveryPromises = destinations.map(destination => 
        sendToDestination(destination, data)
      );
      
      const deliveryResults = await Promise.allSettled(deliveryPromises);
      
      // Process results
      const successfulDeliveries = [];
      const failedDeliveries = [];
      
      deliveryResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const deliveryResult = result.value;
          if (deliveryResult.success) {
            successfulDeliveries.push(deliveryResult);
          } else {
            failedDeliveries.push(deliveryResult);
          }
        } else {
          // Promise rejected
          failedDeliveries.push({
            destination_id: destinations[index].destination_id,
            url: destinations[index].url,
            success: false,
            error: {
              message: result.reason.message || 'Unknown error occurred'
            }
          });
        }
      });
      
      const responseData = {
        account_id: account.account_id,
        processing_time_ms: Date.now() - startTime,
        destinations: {
          total: destinations.length,
          successful: successfulDeliveries.length,
          failed: failedDeliveries.length
        },
        deliveries: {
          successful: successfulDeliveries,
          failed: failedDeliveries
        }
      };
      
      // Determine response status
      if (failedDeliveries.length === 0) {
        return sendSuccessResponse(res, 200, responseData, 'Data successfully forwarded to all destinations');
      } else if (successfulDeliveries.length === 0) {
        return sendErrorResponse(res, 502, 'Failed to forward data to any destination', responseData);
      } else {
        return sendSuccessResponse(res, 207, responseData, 'Data partially forwarded - some destinations failed');
      }
      
    } catch (error) {
      // Handle database or other system errors
      if (error.name === 'ValidationError') {
        return sendErrorResponse(res, 400, 'Validation error', error.message);
      }
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return sendErrorResponse(res, 503, 'Service temporarily unavailable');
      }
      
      return sendErrorResponse(res, 500, 'Internal server error while processing webhook data');
    }
  },

  // GET /server/health - Health check endpoint
  async healthCheck(req, res) {
    try {
      // Simple health check - could be expanded to check database connectivity
      return sendSuccessResponse(res, 200, {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return sendErrorResponse(res, 503, 'Service unhealthy');
    }
  },

  // GET /server/stats/:accountId - Get delivery statistics for an account
  async getDeliveryStats(req, res) {
    try {
      const { accountId } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(accountId)) {
        return sendErrorResponse(res, 400, 'Invalid account ID format');
      }
      
      // Verify account exists
      const account = await Account.findById(accountId);
      if (!account) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      // Get destinations count
      const destinations = await Destination.findByAccountId(accountId);
      
      const stats = {
        account_id: accountId,
        destinations_count: destinations ? destinations.length : 0,
        last_updated: new Date().toISOString()
      };
      
      return sendSuccessResponse(res, 200, stats);
      
    } catch (error) {
      return sendErrorResponse(res, 500, 'Internal server error while fetching delivery statistics');
    }
  }
};