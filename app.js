require('dotenv').config();
const express = require('express');
const app = express();

// Environment variables
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
const nodeEnv = process.env.NODE_ENV || 'development';

// Middlewares
app.use(express.json());

// Import routes
const routes = require('./routes');

// Use routes
app.use('/', routes);

// Swagger setup
const setupSwagger = require('./swagger');
setupSwagger(app);

// Basic Health Check Route
app.get('/', (req, res) => {
  res.json({
    message: 'Webhook App Server is Running',
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Start the server
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port} in ${nodeEnv}`);
  console.log(`Swagger Docs available at http://${host}:${port}/api-docs`);
});