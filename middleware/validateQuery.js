const validateQuery = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // include all errors
      allowUnknown: true, // ignore unknown props
      stripUnknown: true // remove unknown props
    };

    const { error, value } = schema.validate(req.query, validationOptions);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Replace query with validated data
    req.query = value;
    next();
  };
};

module.exports = validateQuery; 