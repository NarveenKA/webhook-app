const User = require('../models/user');
const Role = require('../models/role');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/response');

const assignRole = async (req, res) => {
  try {
    const { user_id, role_name } = req.body;

    if (!user_id || !role_name) {
      return sendErrorResponse(res, 400, 'User ID and role name are required');
    }

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    // Check if role exists
    const role = await Role.findByName(role_name);
    if (!role) {
      return sendErrorResponse(res, 404, 'Role not found');
    }

    // Update user's role
    await User.update(user_id, { 
      role_id: role.role_id,
      updated_by: req.user.user_id
    });

    return sendSuccessResponse(res, 200, {
      message: 'Role assigned successfully',
      user: {
        user_id: user.user_id,
        email: user.email,
        role: role_name
      }
    });
  } catch (error) {
    console.error('Error in assignRole:', error);
    return sendErrorResponse(res, 500, 'Error assigning role');
  }
};

module.exports = {
  assignRole
}; 