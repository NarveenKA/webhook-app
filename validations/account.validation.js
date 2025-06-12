const Joi = require('joi');

const createAccountSchema = Joi.object({
  account_name: Joi.string()
    .required()
    .min(2)
    .trim()
    .messages({
      'string.empty': 'Account name is required',
      'string.min': 'Account name must be at least 2 characters long',
      'any.required': 'Account name is required'
    }),
  website: Joi.string()
    .uri({
      scheme: [
        'http',
        'https'
      ]
    })
    .allow(null)
    .messages({
      'string.uri': 'Website must be a valid URL starting with http:// or https://'
    })
});

const updateAccountSchema = Joi.object({
  account_name: Joi.string()
    .min(2)
    .trim()
    .messages({
      'string.min': 'Account name must be at least 2 characters long'
    }),
  website: Joi.string()
    .uri({
      scheme: [
        'http',
        'https'
      ]
    })
    .allow(null)
    .messages({
      'string.uri': 'Website must be a valid URL starting with http:// or https://'
    })
}).min(1);

module.exports = {
  createAccountSchema,
  updateAccountSchema
}; 