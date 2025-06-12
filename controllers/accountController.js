const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const Account = require("../models/account");
const Destination = require("../models/destination");
const { sendErrorResponse, sendSuccessResponse } = require("../utils/response");

module.exports = {
  // POST /accounts - Create new account
  async create(req, res) {
    try {
      const { account_name, website } = req.body;

      // Create new account
      const account = {
        account_id: uuidv4(),
        account_name: account_name.trim(),
        website: website ? website.trim() : null,
        app_secret_token: crypto.randomBytes(32).toString("hex"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: req.user?.user_id || "system",
        updated_by: req.user?.user_id || "system",
      };

      await Account.create(account);

      return sendSuccessResponse(
        res,
        201,
        account,
        "Account created successfully"
      );
    } catch (error) {
      console.error('Error in create account:', error);
      return sendErrorResponse(
        res,
        500,
        "Internal server error while creating account"
      );
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
        search,
      });

      // Remove sensitive data from all accounts
      const safeAccounts = accounts.map((account) => {
        const { app_secret_token, ...safeAccount } = account;
        return safeAccount;
      });

      return sendSuccessResponse(res, 200, {
        accounts: safeAccounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: safeAccounts.length,
        },
      });
    } catch (error) {
      console.error('Error in getAll accounts:', error);
      return sendErrorResponse(
        res,
        500,
        "Internal server error while fetching accounts"
      );
    }
  },

  // GET /accounts/:account_id - Get account by ID
  async getById(req, res) {
    try {
      const { account_id } = req.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(account_id)) {
        return sendErrorResponse(res, 400, "Invalid account ID format");
      }

      const account = await Account.findById(account_id);
      if (!account) {
        return sendErrorResponse(res, 404, "Account not found");
      }

      // Remove sensitive data
      const { app_secret_token, ...safeAccount } = account;

      return sendSuccessResponse(res, 200, safeAccount);
    } catch (error) {
      console.error('Error in getById account:', error);
      return sendErrorResponse(
        res,
        500,
        "Internal server error while fetching account"
      );
    }
  },

  // PUT /accounts/:account_id - Update account
  async update(req, res) {
    try {
      const { account_id } = req.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(account_id)) {
        return sendErrorResponse(res, 400, "Invalid account ID format");
      }

      // Check if account exists
      const existingAccount = await Account.findById(account_id);
      if (!existingAccount) {
        return sendErrorResponse(res, 404, "Account not found");
      }

      // Validate update data
      const allowedFields = ["account_name", "website"];
      const updateData = {};

      Object.keys(req.body).forEach((key) => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
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

      await Account.update(account_id, updateData);

      // Fetch updated account
      const updatedAccount = await Account.findById(account_id);
      const { app_secret_token, ...safeAccount } = updatedAccount;

      return sendSuccessResponse(
        res,
        200,
        safeAccount,
        "Account updated successfully"
      );
    } catch (error) {
      console.error('Error in update account:', error);
      return sendErrorResponse(
        res,
        500,
        "Internal server error while updating account"
      );
    }
  },

  // DELETE /accounts/:account_id - Delete account
  async delete(req, res) {
    try {
      const { account_id } = req.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(account_id)) {
        return sendErrorResponse(res, 400, "Invalid account ID format");
      }

      // Check if account exists
      const existingAccount = await Account.findById(account_id);
      if (!existingAccount) {
        return sendErrorResponse(res, 404, "Account not found");
      }

      // Delete associated destinations first
      await Destination.deleteByAccountId(account_id);

      // Delete the account
      await Account.delete(account_id);

      return sendSuccessResponse(
        res,
        200,
        null,
        "Account and associated destinations deleted successfully"
      );
    } catch (error) {
      console.error('Error in delete account:', error);
      return sendErrorResponse(
        res,
        500,
        "Internal server error while deleting account"
      );
    }
  }
};
