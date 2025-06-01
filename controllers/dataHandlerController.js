const axios = require('axios');
const Account = require('../models/account');
const Destination = require('../models/destination');

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

// Incoming Data Handler
const incomingData = async (req, res) => {
  try {
    const secretToken = req.header('CL-X-TOKEN');
    const requestData = req.body;

    // Validate secret token
    if (!secretToken) {
      return sendErrorResponse(res, 401, 'Un Authenticate');
    }

    // Ensure incoming data is JSON (if Content-Type is not application/json or data is not an object)
    if (req.method !== 'POST' || !requestData || typeof requestData !== 'object') {
      return sendErrorResponse(res, 400, 'Invalid Data');
    }

    // Find account by secret token
    const account = await Account.findBySecretToken(secretToken);
    if (!account) {
      return sendErrorResponse(res, 401, 'Un Authenticate');
    }

    // Fetch destinations for this account
    const destinations = await Destination.findByAccountId(account.account_id);
    if (!destinations || destinations.length === 0) {
      return sendErrorResponse(res, 404, 'No destinations found for this account');
    }

    // Dispatch data to each destination
    const dispatchResults = [];

    for (const dest of destinations) {
      try {
        const destHeaders = dest.headers || {};
        const destMethod = dest.http_method.toUpperCase();
        const destUrl = dest.url;

        let response;
        if (destMethod === 'GET') {
          response = await axios.get(destUrl, {
            params: requestData,
            headers: destHeaders,
          });
        } else if (['POST', 'PUT'].includes(destMethod)) {
          response = await axios({
            method: destMethod.toLowerCase(),
            url: destUrl,
            data: requestData,
            headers: destHeaders,
          });
        } else {
          // Skip unsupported methods for now
          dispatchResults.push({
            destination: destUrl,
            status: 'skipped',
            reason: `Unsupported HTTP method: ${destMethod}`,
          });
          continue;
        }

        dispatchResults.push({
          destination: destUrl,
          status: 'success',
          statusCode: response.status,
        });
      } catch (err) {
        dispatchResults.push({
          destination: dest.url,
          status: 'failed',
          error: err.message,
        });
      }
    }

    return sendSuccessResponse(res, 200, {
      message: 'Data dispatched to destinations',
      results: dispatchResults,
    });
  } catch (error) {
    console.error('Error in incomingData:', error);
    return sendErrorResponse(res, 500, 'Internal server error while processing incoming data');
  }
};

module.exports = { incomingData };
