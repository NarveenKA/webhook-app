const Log = require('../models/log');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/response');

const getLogs = async (req, res) => {
  try {
    const { account_id, page = 1, limit = 10 } = req.query;

    const filters = {};
    if (account_id) {
      filters.account_id = account_id;
    }

    const logs = await Log.findAll(filters, parseInt(page), parseInt(limit));
    const total = await Log.count(filters);

    return sendSuccessResponse(res, 200, {
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getLogs:', error);
    return sendErrorResponse(res, 500, 'Error retrieving logs');
  }
};

const getLogById = async (req, res) => {
  try {
    const { event_id } = req.params;

    const log = await Log.findById(event_id);
    if (!log) {
      return sendErrorResponse(res, 404, 'Log not found');
    }

    return sendSuccessResponse(res, 200, { log });
  } catch (error) {
    console.error('Error in getLogById:', error);
    return sendErrorResponse(res, 500, 'Error retrieving log');
  }
};

module.exports = {
  getLogs,
  getLogById
}; 