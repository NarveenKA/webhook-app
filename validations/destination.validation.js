const Joi = require('joi');

const headerSchema = Joi.object().pattern(
  Joi.string().required(),
  Joi.string().required()
);

const createDestinationSchema = Joi.object({
  account_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Account ID must be a valid UUID',
      'any.required': 'Account ID is required'
    }),
  url: Joi.string()
    .uri({
      scheme: [
        'http',
        'https'
      ]
    })
    .required()
    .messages({
      'string.uri': 'URL must be a valid HTTP/HTTPS URL',
      'any.required': 'URL is required'
    }),
  http_method: Joi.string()
    .valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')
    .uppercase()
    .required()
    .messages({
      'any.only': 'HTTP method must be one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
      'any.required': 'HTTP method is required'
    }),
  headers: headerSchema
    .required()
    .messages({
      'any.required': 'Headers are required'
    })
});

const updateDestinationSchema = Joi.object({
  url: Joi.string()
    .uri({
      scheme: [
        'http',
        'https'
      ]
    })
    .messages({
      'string.uri': 'URL must be a valid HTTP/HTTPS URL'
    }),
  http_method: Joi.string()
    .valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')
    .uppercase()
    .messages({
      'any.only': 'HTTP method must be one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS'
    }),
  headers: headerSchema
}).min(1);

module.exports = {
  createDestinationSchema,
  updateDestinationSchema
}; 