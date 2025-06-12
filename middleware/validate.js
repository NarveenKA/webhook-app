const validateRequest = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // include all errors
      allowUnknown: true, // ignore unknown props
      stripUnknown: true // remove unknown props
    };

    const { error, value } = schema.validate(req.body, validationOptions);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Replace request body with validated data
    req.body = value;
    next();
  };
};

module.exports = validateRequest; 