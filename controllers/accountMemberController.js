const { v4: uuidv4 } = require('uuid');
const AccountMember = require('../models/accountMember');
const { sendErrorResponse, sendSuccessResponse } = require('../utils/response');

const getMembers = async (req, res) => {
  try {
    const { account_id } = req.query;
    const query = account_id ? { account_id } : {};
    
    const members = await AccountMember.findAll(query);
    return sendSuccessResponse(res, 200, { members });
  } catch (error) {
    console.error('Error in getMembers:', error);
    return sendErrorResponse(res, 500, 'Error retrieving account members');
  }
};

const getMemberById = async (req, res) => {
  try {
    const { member_id } = req.params;
    
    const member = await AccountMember.findById(member_id);
    if (!member) {
      return sendErrorResponse(res, 404, 'Account member not found');
    }

    return sendSuccessResponse(res, 200, { member });
  } catch (error) {
    console.error('Error in getMemberById:', error);
    return sendErrorResponse(res, 500, 'Error retrieving account member');
  }
};

const createMember = async (req, res) => {
  try {
    const { account_id, user_id } = req.body;

    if (!account_id || !user_id) {
      return sendErrorResponse(res, 400, 'Account ID and user ID are required');
    }

    // Check if member already exists
    const existingMember = await AccountMember.findByAccountAndUser(account_id, user_id);
    if (existingMember) {
      return sendErrorResponse(res, 409, 'User is already a member of this account');
    }

    const member = await AccountMember.create({
      member_id: uuidv4(),
      account_id,
      user_id,
      created_by: req.user.user_id,
      updated_by: req.user.user_id
    });

    return sendSuccessResponse(res, 201, {
      message: 'Account member created successfully',
      member
    });
  } catch (error) {
    console.error('Error in createMember:', error);
    return sendErrorResponse(res, 500, 'Error creating account member');
  }
};

const updateMember = async (req, res) => {
  try {
    const { member_id } = req.params;
    const updates = { ...req.body, updated_by: req.user.user_id };

    const member = await AccountMember.findById(member_id);
    if (!member) {
      return sendErrorResponse(res, 404, 'Account member not found');
    }

    await AccountMember.update(member_id, updates);
    const updatedMember = await AccountMember.findById(member_id);

    return sendSuccessResponse(res, 200, {
      message: 'Account member updated successfully',
      member: updatedMember
    });
  } catch (error) {
    console.error('Error in updateMember:', error);
    return sendErrorResponse(res, 500, 'Error updating account member');
  }
};

const deleteMember = async (req, res) => {
  try {
    const { member_id } = req.params;

    const member = await AccountMember.findById(member_id);
    if (!member) {
      return sendErrorResponse(res, 404, 'Account member not found');
    }

    await AccountMember.delete(member_id);

    return sendSuccessResponse(res, 200, {
      message: 'Account member deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteMember:', error);
    return sendErrorResponse(res, 500, 'Error deleting account member');
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
}; 