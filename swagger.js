// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Webhook App API',
      version: '1.0.0',
      description: 'API Documentation for Webhook App',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Update this if you use different ports or environments
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs (your route files)
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
