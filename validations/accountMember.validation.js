const Joi = require('joi');

const createMemberSchema = Joi.object({
  account_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Account ID must be a valid UUID',
      'any.required': 'Account ID is required'
    }),
  user_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required'
    })
});

const updateMemberSchema = Joi.object({
  role_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Role ID must be a valid UUID',
      'any.required': 'Role ID is required'
    })
});

module.exports = {
  createMemberSchema,
  updateMemberSchema
}; 