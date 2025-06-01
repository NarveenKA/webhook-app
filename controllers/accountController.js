// /controllers/accountController.js

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Account = require('../models/account');
const Destination = require('../models/destination');

// Helper function for consistent error responses
const sendErrorResponse = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      timestamp: new Date().toISOString()
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

// Input validation helper
const validateCreateInput = (req) => {
  const { email, account_name, website } = req.body;
  const errors = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email format is required');
  }
  
  if (!account_name) {
    errors.push('Account name is required');
  } else if (account_name.trim().length < 2) {
    errors.push('Account name must be at least 2 characters long');
  }
  
  if (website && !/^https?:\/\/.+/.test(website)) {
    errors.push('Website must be a valid URL starting with http:// or https://');
  }
  
  return errors;
};

module.exports = {
  // POST /accounts - Create new account
  async create(req, res) {
    try {
      // Input validation
      const validationErrors = validateCreateInput(req);
      if (validationErrors.length > 0) {
        return sendErrorResponse(res, 400, 'Validation failed', validationErrors);
      }
      
      const { email, account_name, website } = req.body;
      
      // Check for existing account
      const existing = await Account.findByEmail(email.toLowerCase().trim());
      if (existing) {
        return sendErrorResponse(res, 409, 'Account with this email already exists');
      }
      
      // Create new account
      const account = {
        account_id: uuidv4(),
        email: email.toLowerCase().trim(),
        account_name: account_name.trim(),
        website: website ? website.trim() : null,
        app_secret_token: crypto.randomBytes(32).toString('hex'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createdAccount = await Account.create(account);
      
      return sendSuccessResponse(res, 201, account, 'Account created successfully');
      
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT' || error.code === 11000) {
        return sendErrorResponse(res, 409, 'Account with this email already exists');
      }
      return sendErrorResponse(res, 500, 'Internal server error while creating account');
    }
  },

  // GET /accounts - Get all accounts
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const accounts = await Account.findAll({
        limit: parseInt(limit),
        offset,
        search
      });
      
      // Remove sensitive data from all accounts
      const safeAccounts = accounts.map(account => {
        const { app_secret_token, ...safeAccount } = account;
        return safeAccount;
      });
      
      return sendSuccessResponse(res, 200, {
        accounts: safeAccounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: safeAccounts.length
        }
      });
      
    } catch (error) {
      return sendErrorResponse(res, 500, 'Internal server error while fetching accounts');
    }
  },

  // GET /accounts/:id - Get account by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return sendErrorResponse(res, 400, 'Invalid account ID format');
      }
      
      const account = await Account.findById(id);
      if (!account) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      // Remove sensitive data
      const { app_secret_token, ...safeAccount } = account;
      
      return sendSuccessResponse(res, 200, safeAccount);
      
    } catch (error) {
      return sendErrorResponse(res, 500, 'Internal server error while fetching account');
    }
  },

  // PUT /accounts/:id - Update account
  async update(req, res) {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return sendErrorResponse(res, 400, 'Invalid account ID format');
      }
      
      // Check if account exists
      const existingAccount = await Account.findById(id);
      if (!existingAccount) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      // Validate update data
      const allowedFields = ['account_name', 'website'];
      const updateData = {};
      const errors = [];
      
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });
      
      if (updateData.account_name && updateData.account_name.trim().length < 2) {
        errors.push('Account name must be at least 2 characters long');
      }
      
      if (updateData.website && !/^https?:\/\/.+/.test(updateData.website)) {
        errors.push('Website must be a valid URL starting with http:// or https://');
      }
      
      if (errors.length > 0) {
        return sendErrorResponse(res, 400, 'Validation failed', errors);
      }
      
      if (Object.keys(updateData).length === 0) {
        return sendErrorResponse(res, 400, 'No valid fields provided for update');
      }
      
      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();
      
      const updated = await Account.update(id, updateData);
      if (!updated) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      // Fetch updated account
      await Account.findById(id);
      
      return sendSuccessResponse(res, 200, updateData, 'Account updated successfully');
      
    } catch (error) {
      return sendErrorResponse(res, 500, 'Internal server error while updating account');
    }
  },

  // DELETE /accounts/:id - Delete account
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return sendErrorResponse(res, 400, 'Invalid account ID format');
      }
      
      // Check if account exists
      const existingAccount = await Account.findById(id);
      if (!existingAccount) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      // Delete associated destinations first
      await Destination.deleteByAccountId(id);
      
      // Delete the account
      const deleted = await Account.delete(id);
      if (!deleted) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      return sendSuccessResponse(res, 200, null, 'Account and associated destinations deleted successfully');
      
    } catch (error) {
      return sendErrorResponse(res, 500, 'Internal server error while deleting account');
    }
  },

  // GET /accounts/:id/secret - Get account secret token (separate endpoint for security)
  async getSecret(req, res) {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return sendErrorResponse(res, 400, 'Invalid account ID format');
      }
      
      const account = await Account.findById(id);
      if (!account) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      return sendSuccessResponse(res, 200, { 
        app_secret_token: account.app_secret_token 
      });
      
    } catch (error) {
      return sendErrorResponse(res, 500, 'Internal server error while fetching secret token');
    }
  },

  // POST /accounts/:id/regenerate-secret - Regenerate secret token
  async regenerateSecret(req, res) {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return sendErrorResponse(res, 400, 'Invalid account ID format');
      }
      
      // Check if account exists
      const existingAccount = await Account.findById(id);
      if (!existingAccount) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      const newToken = crypto.randomBytes(32).toString('hex');
      const updated = await Account.update(id, { 
        app_secret_token: newToken,
        updated_at: new Date().toISOString()
      });
      
      if (!updated) {
        return sendErrorResponse(res, 404, 'Account not found');
      }
      
      return sendSuccessResponse(res, 200, { 
        app_secret_token: newToken 
      }, 'Secret token regenerated successfully');
      
    } catch (error) {
      return sendErrorResponse(res, 500, 'Internal server error while regenerating secret token');
    }
  }
};