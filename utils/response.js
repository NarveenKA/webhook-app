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
  
module.exports = {
    sendErrorResponse,
    sendSuccessResponse
};
  