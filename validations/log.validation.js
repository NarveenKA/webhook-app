const Joi = require('joi');

const getLogsQuerySchema = Joi.object({
  account_id: Joi.string()
    .uuid()
    .messages({
      'string.guid': 'Account ID must be a valid UUID'
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be greater than or equal to 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be greater than or equal to 1',
      'number.max': 'Limit must be less than or equal to 100'
    })
});

module.exports = {
  getLogsQuerySchema
}; 