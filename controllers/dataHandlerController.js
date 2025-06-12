const Account = require('../models/account');
const Destination = require('../models/destination');
const webhookQueue = require('../utils/queue');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/response');

// Incoming Data Handler
const incomingData = async (req, res) => {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return sendErrorResponse(res, 405, 'Method not allowed. Only POST requests are accepted.');
    }

    // Validate headers
    const secretToken = req.header('CL-X-TOKEN');
    const eventId = req.header('CL-X-EVENT-ID');

    if (!secretToken) {
      return sendErrorResponse(res, 401, 'Unauthorized - Missing secret token');
    }

    if (!eventId) {
      return sendErrorResponse(res, 400, 'Bad Request - Missing event ID');
    }

    const requestData = req.body;

    // Validate content type and data
    if (!requestData || typeof requestData !== 'object') {
      return sendErrorResponse(res, 400, 'Invalid request body. Expected JSON data.');
    }

    // Find account by secret token
    const account = await Account.findBySecretToken(secretToken);
    if (!account) {
      return sendErrorResponse(res, 401, 'Unauthorized - Invalid secret token');
    }

    // Fetch destinations for this account
    const destinations = await Destination.findByAccountId(account.account_id);
    if (!destinations || destinations.length === 0) {
      return sendErrorResponse(res, 404, 'No destinations found for this account');
    }

    // Add to processing queue
    await webhookQueue.addToQueue({
      eventId,
      accountId: account.account_id,
      payload: requestData,
      destinations
    });

    return sendSuccessResponse(res, 202, {
      message: 'Data accepted for processing',
      event_id: eventId
    });

  } catch (error) {
    console.error('Error in incomingData:', error);
    return sendErrorResponse(res, 500, 'Internal server error while processing incoming data');
  }
};

module.exports = { incomingData };
