const jwt = require('jsonwebtoken');
const { sendErrorResponse } = require('../utils/response');
const User = require('../models/user');
const Role = require('../models/role');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return sendErrorResponse(res, 401, 'No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.user_id);
    
    if (!user) {
      return sendErrorResponse(res, 401, 'Invalid token');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendErrorResponse(res, 401, 'Invalid token');
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendErrorResponse(res, 401, 'Authentication required');
    }

    const userRole = await Role.findById(req.user.role_id);
    
    if (userRole.role_name !== 'Admin') {
      return sendErrorResponse(res, 403, 'Admin access required');
    }

    next();
  } catch (error) {
    return sendErrorResponse(res, 500, 'Error checking user role');
  }
};

const hasRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendErrorResponse(res, 401, 'Authentication required');
      }

      const userRole = await Role.findById(req.user.role_id);
      
      if (!allowedRoles.includes(userRole.role_name)) {
        return sendErrorResponse(res, 403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      return sendErrorResponse(res, 500, 'Error checking user role');
    }
  };
};

module.exports = {
  verifyToken,
  isAdmin,
  hasRole
}; 