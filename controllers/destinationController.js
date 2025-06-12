const { v4: uuidv4 } = require("uuid");
const Destination = require("../models/destination");
const Account = require("../models/account");
const { sendErrorResponse, sendSuccessResponse } = require("../utils/response");

// Validate UUID format
const isValidUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

// Validate HTTP method
const isValidHttpMethod = (method) => {
  const validMethods = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
  ];
  return validMethods.includes(method.toUpperCase());
};

// Validate headers
const validateHeaders = (headers) => {
  const errors = [];

  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    errors.push("Headers must be an object");
    return errors;
  }

  // Check if headers are empty
  if (Object.keys(headers).length === 0) {
    errors.push("At least one header is required");
    return errors;
  }

  // Validate each header key and value
  for (const [key, value] of Object.entries(headers)) {
    if (typeof key !== "string" || key.trim().length === 0) {
      errors.push("Header keys must be non-empty strings");
    }
    if (typeof value !== "string") {
      errors.push(`Header value for '${key}' must be a string`);
    }
  }

  return errors;
};

// Input validation for create/update
const validateDestinationInput = (req, isUpdate = false) => {
  const { account_id, url, http_method, headers } = req.body;
  const errors = [];

  // Required field validation for create
  if (!isUpdate) {
    if (!account_id) {
      errors.push("Account ID is required");
    } else if (!isValidUUID(account_id)) {
      errors.push("Invalid account ID format - must be a valid UUID");
    }

    if (!url) {
      errors.push("URL is required");
    }

    if (!http_method) {
      errors.push("HTTP method is required");
    }

    if (!headers) {
      errors.push("Headers are required");
    }
  }

  // Field validation (for both create and update)
  if (account_id && !isValidUUID(account_id)) {
    errors.push("Invalid account ID format - must be a valid UUID");
  }

  if (url && !isValidURL(url)) {
    errors.push("Invalid URL format - must be a valid HTTP/HTTPS URL");
  }

  if (http_method && !isValidHttpMethod(http_method)) {
    errors.push(
      "Invalid HTTP method - must be one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"
    );
  }

  if (headers) {
    const headerErrors = validateHeaders(headers);
    errors.push(...headerErrors);
  }

  return errors;
};

module.exports = {
  // GET /destinations - Get all destinations
  async getAll(req, res) {
    try {
      const { account_id } = req.query;

      // If account_id is provided, validate it
      if (account_id) {
        if (!isValidUUID(account_id)) {
          return sendErrorResponse(res, 400, "Invalid account ID format");
        }

        // Check if account exists
        const account = await Account.findById(account_id);
        if (!account) {
          return sendErrorResponse(res, 404, "Account not found");
        }
      }

      const destinations = await Destination.findAll(account_id);
      return sendSuccessResponse(res, 200, { destinations });
    } catch (error) {
      console.error('Error in getAll destinations:', error);
      return sendErrorResponse(
        res,
        500,
        "Internal server error while fetching destinations"
      );
    }
  },

  // GET /destinations/:destination_id - Get destination by ID
  async getById(req, res) {
    try {
      const { destination_id } = req.params;

      if (!isValidUUID(destination_id)) {
        return sendErrorResponse(res, 400, "Invalid destination ID format");
      }

      const destination = await Destination.findById(destination_id);
      if (!destination) {
        return sendErrorResponse(res, 404, "Destination not found");
      }

      return sendSuccessResponse(res, 200, destination);
    } catch (error) {
      console.error('Error in getById destination:', error);
      return sendErrorResponse(
        res,
        500,
        "Internal server error while fetching destination"
      );
    }
  },

  // POST /destinations - Create new destination
  async create(req, res) {
    try {
      const { account_id, url, http_method, headers } = req.body;

      // Check if account exists
      const account = await Account.findById(account_id);
      if (!account) {
        return sendErrorResponse(res, 404, "Account not found");
      }

      // Create destination
      const destination = {
        destination_id: uuidv4(),
        account_id,
        url,
        http_method: http_method.toUpperCase(),
        headers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: req.user?.user_id || "system",
        updated_by: req.user?.user_id || "system",
      };

      try {
      await Destination.create(destination);
      } catch (error) {
        if (error.message === "Duplicate destination") {
          return sendErrorResponse(
            res,
            409,
            "A destination with this URL and HTTP method already exists for this account"
          );
        }
        throw error;
      }

      return sendSuccessResponse(
        res,
        201,
        destination,
        "Destination created successfully"
      );
    } catch (error) {
      console.error('Error in create destination:', error);
      return sendErrorResponse(
        res,
        500,
        "Internal server error while creating destination"
      );
    }
  },

  // PUT /destinations/:destination_id - Update destination
  async update(req, res) {
    try {
      const { destination_id } = req.params;

      if (!isValidUUID(destination_id)) {
        return sendErrorResponse(res, 400, "Invalid destination ID format");
      }

      // Check if destination exists
      const existingDestination = await Destination.findById(destination_id);
      if (!existingDestination) {
        return sendErrorResponse(res, 404, "Destination not found");
      }

      // Prepare update data
      const allowedFields = ["url", "http_method", "headers"];
      const updateData = {};

      Object.keys(req.body).forEach((key) => {
        if (allowedFields.includes(key)) {
          updateData[key] = key === "http_method" ? req.body[key].toUpperCase() : req.body[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return sendErrorResponse(
          res,
          400,
          "No valid fields provided for update"
        );
      }

      // Add updated timestamp and user
      updateData.updated_at = new Date().toISOString();
      updateData.updated_by = req.user?.user_id || "system";

      try {
        await Destination.update(destination_id, updateData);
      } catch (error) {
        if (error.message === "Duplicate destination") {
          return sendErrorResponse(
            res,
            409,
            "A destination with this URL and HTTP method already exists for this account"
          );
        }
        throw error;
      }

      // Fetch updated destination
      const updatedDestination = await Destination.findById(destination_id);

      return sendSuccessResponse(
        res,
        200,
        updatedDestination,
        "Destination updated successfully"
      );
    } catch (error) {
      console.error('Error in update destination:', error);
      return sendErrorResponse(
        res,
        500,
        "Internal server error while updating destination"
      );
    }
  },

  // DELETE /destinations/:destination_id - Delete destination
  async delete(req, res) {
    try {
      const { destination_id } = req.params;

      if (!isValidUUID(destination_id)) {
        return sendErrorResponse(res, 400, "Invalid destination ID format");
      }

      // Check if destination exists
      const destination = await Destination.findById(destination_id);
      if (!destination) {
        return sendErrorResponse(res, 404, "Destination not found");
      }

      await Destination.delete(destination_id);

      return sendSuccessResponse(
        res,
        200,
        { message: "Destination deleted successfully" }
      );
    } catch (error) {
      console.error('Error in delete destination:', error);
      return sendErrorResponse(
        res,
        500,
        "Internal server error while deleting destination"
      );
    }
  },
};
