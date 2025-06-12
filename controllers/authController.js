const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const Role = require('../models/role');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendErrorResponse(res, 400, 'Email and password are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendErrorResponse(res, 400, 'Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      return sendErrorResponse(res, 400, 'Password must be at least 8 characters long');
    }

    // Get Admin role
    const defaultRole = await Role.findByName('Admin');
    if (!defaultRole) {
      console.error('Admin role not found');
      return sendErrorResponse(res, 500, 'Error assigning user role');
    }

    // Create user
    const userId = uuidv4();
    try {
      await User.create({
        user_id: userId,
        email,
        password,
        role_id: defaultRole.role_id
      });
    } catch (error) {
      if (error.message === 'Email already exists') {
        return sendErrorResponse(res, 409, 'An account with this email already exists');
      }
      throw error;
    }

    return sendSuccessResponse(res, 201, {
      message: 'User registered successfully. Please login to continue.',
      user: {
        user_id: userId,
        email,
        role: defaultRole.role_name
      }
    });
  } catch (error) {
    console.error('Error in register:', error);
    return sendErrorResponse(res, 500, 'Error registering user');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendErrorResponse(res, 400, 'Email and password are required');
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    // Get user role
    const role = await Role.findById(user.role_id);
    if (!role) {
      console.error(`Role not found for user ${user.user_id}`);
      return sendErrorResponse(res, 500, 'Error retrieving user role');
    }

    const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: '24h' });

    return sendSuccessResponse(res, 200, {
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: role.role_name
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    return sendErrorResponse(res, 500, 'Error logging in');
  }
};

const inviteUser = async (req, res) => {
  try {
    const { email } = req.body;
    const invitingUser = req.user;

    if (!email) {
      return sendErrorResponse(res, 400, 'Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendErrorResponse(res, 400, 'Invalid email format');
    }

    // Check if user already exists
    try {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return sendErrorResponse(res, 409, 'An account with this email already exists');
      }
    } catch (error) {
      if (error.message === 'Email already exists') {
        return sendErrorResponse(res, 409, 'An account with this email already exists');
      }
      throw error;
    }

    // Generate invitation token
    const invitationToken = jwt.sign(
      { email, invited_by: invitingUser.user_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Generate registration link
    const registrationLink = `${BASE_URL}/register?token=${invitationToken}`;

    // In a real application, you would send this link via email
    return sendSuccessResponse(res, 201, {
      message: 'User invited successfully',
      registrationLink,
      note: 'In a production environment, this link would be sent via email to the invited user'
    });
  } catch (error) {
    console.error('Error in inviteUser:', error);
    return sendErrorResponse(res, 500, 'Error inviting user');
  }
};

module.exports = {
  register,
  login,
  inviteUser
}; 