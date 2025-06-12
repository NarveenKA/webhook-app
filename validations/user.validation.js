const Joi = require('joi');

const updateUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    }),
  role_id: Joi.string()
    .uuid()
    .messages({
      'string.guid': 'Role ID must be a valid UUID'
    })
}).min(1);

const assignRoleSchema = Joi.object({
  user_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required'
    }),
  role_name: Joi.string()
    .required()
    .valid('Admin', 'User')
    .messages({
      'any.required': 'Role name is required',
      'any.only': 'Role name must be either Admin or User'
    })
});

module.exports = {
  updateUserSchema,
  assignRoleSchema
}; 