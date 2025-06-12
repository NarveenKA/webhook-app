const { v4: uuidv4 } = require("uuid");
const User = require("../models/user");
const Role = require("../models/role");
const { sendErrorResponse, sendSuccessResponse } = require("../utils/response");

// Input validation helper
const validateCreateInput = (req) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Valid email format is required");
  }

  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  return errors;
};

const validateUpdateInput = (updates) => {
  const errors = [];

  if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
    errors.push("Valid email format is required");
  }

  if (updates.password && updates.password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  return errors;
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    
    // Get roles for each user
    const usersWithRoles = await Promise.all(users.map(async (user) => {
      const role = await Role.findById(user.role_id);
      return {
        ...user,
        role: role.role_name
      };
    }));

    return sendSuccessResponse(res, 200, { users: usersWithRoles });
  } catch (error) {
    console.error('Error in getUsers:', error);
    return sendErrorResponse(res, 500, 'Error retrieving users');
  }
};

const getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await User.findById(user_id);
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    // Get user's role
    const role = await Role.findById(user.role_id);
    
    return sendSuccessResponse(res, 200, {
      user: {
        ...user,
        role: role.role_name
      }
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    return sendErrorResponse(res, 500, 'Error retrieving user');
  }
};

const updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const updates = { ...req.body };

    // Validate input
    const validationErrors = validateUpdateInput(updates);
    if (validationErrors.length > 0) {
      return sendErrorResponse(res, 400, 'Validation failed', validationErrors);
    }

    const user = await User.findById(user_id);
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    // Check if email is being updated and is not already taken
    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findByEmail(updates.email);
      if (existingUser) {
        return sendErrorResponse(res, 409, 'Email already taken');
      }
    }

    // Remove any fields that shouldn't be updated
    const allowedUpdates = ['email', 'password', 'role_id'];
    Object.keys(updates).forEach(key => {
      if (!allowedUpdates.includes(key)) {
        delete updates[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return sendErrorResponse(res, 400, 'No valid fields provided for update');
    }

    await User.update(user_id, updates);
    const updatedUser = await User.findById(user_id);
    const role = await Role.findById(updatedUser.role_id);

    return sendSuccessResponse(res, 200, {
      message: 'User updated successfully',
      user: {
        ...updatedUser,
        role: role.role_name
      }
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    return sendErrorResponse(res, 500, 'Error updating user');
  }
};

const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await User.findById(user_id);
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    await User.delete(user_id);

    return sendSuccessResponse(res, 200, {
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return sendErrorResponse(res, 500, 'Error deleting user');
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
