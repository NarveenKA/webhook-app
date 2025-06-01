// app.js

require('dotenv').config();
const express = require('express');
const app = express();

// Environment variables
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
const nodeEnv = process.env.NODE_ENV || 'development';

// Middlewares
app.use(express.json());

// Import Routes
const accountRoutes = require('./routes/account');
const destinationRoutes = require('./routes/destination');
const dataHandlerRoutes = require('./routes/dataHandler');

// Use Routes
app.use('/accounts', accountRoutes);
app.use('/destinations', destinationRoutes);
app.use('/server', dataHandlerRoutes);

// Basic Health Check Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Webhook App Server is Running',
    environment: nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(port, host, () => {
  // Server started successfully
  console.log(`Server is running on http://${host}:${port} in ${nodeEnv}`);
});