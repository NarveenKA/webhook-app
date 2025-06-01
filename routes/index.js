const express = require('express');
const router = express.Router();

// Import individual route modules
const accountRoutes = require('./account');
const destinationRoutes = require('./destination');
const dataHandlerRoutes = require('./dataHandler');

// Mount routes
router.use('/accounts', accountRoutes);
router.use('/destinations', destinationRoutes);
router.use('/server', dataHandlerRoutes);

module.exports = router;
