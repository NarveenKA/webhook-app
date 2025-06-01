// /routes/dataHandler.js

const express = require('express');
const router = express.Router();
const dataHandlerController = require('../controllers/dataHandlerController');

// Incoming data route
router.post('/incoming_data', dataHandlerController.receiveData);

module.exports = router;
