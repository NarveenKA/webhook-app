// app.js

const express = require('express');
const app = express();
const port = 3000; // or process.env.PORT

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
  res.json({ message: 'Webhook App Server is Running' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
