// /routes/destination.js

const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');

// Create a new destination
router.post('/', destinationController.create);

// Get all destinations for a specific account
router.get('/account/:account_id', destinationController.getByAccountId);

// Get a specific destination by its ID
router.get('/:id', destinationController.getById);

// Update a destination by its ID
router.put('/:id', destinationController.update);

// Delete a destination by its ID
router.delete('/:id', destinationController.delete);

module.exports = router;
