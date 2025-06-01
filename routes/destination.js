const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');

/**
 * @swagger
 * tags:
 *   name: Destinations
 *   description: API endpoints for managing destinations. 
 */

/**
 * @swagger
 * /destinations:
 *   post:
 *     summary: Create a new destination
 *     tags: [Destinations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_id
 *               - url
 *               - http_method
 *               - headers
 *             properties:
 *               account_id:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the associated account
 *               url:
 *                 type: string
 *                 example: "https://newsite.com"
 *                 description: Destination URL (must be valid HTTP/HTTPS)
 *               http_method:
 *                 type: string
 *                 enum: [GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS]
 *                 description: HTTP method for the destination
 *               headers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   APP_ID: "1234APPID1234"
 *                   APP_SECRET: "enwdj3bshwer43bjhjs9ereuinkjcnsiurew8s"
 *                   ACTION: "user.update"
 *                   Content-Type: "application/json"
 *                   Accept: "*"
 *                 description: Custom headers as key-value pairs (mandatory)
 *     responses:
 *       201:
 *         description: Destination created successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Account not found
 *       409:
 *         description: Destination already exists
 */
router.post('/', destinationController.create);

/**
 * @swagger
 * /destinations/account/{account_id}:
 *   get:
 *     summary: Get destinations by account ID
 *     tags: [Destinations]
 *     parameters:
 *       - in: path
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the account
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: "Page number for pagination (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "Number of records per page (default: 10)"
 *     responses:
 *       200:
 *         description: List of destinations
 *       400:
 *         description: Invalid account ID format
 *       404:
 *         description: Account not found
 */
router.get('/account/:account_id', destinationController.getByAccountId);

/**
 * @swagger
 * /destinations/{id}:
 *   get:
 *     summary: Get a destination by ID
 *     tags: [Destinations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination ID
 *     responses:
 *       200:
 *         description: Destination details
 *       400:
 *         description: Invalid destination ID format
 *       404:
 *         description: Destination not found
 */
router.get('/:id', destinationController.getById);

/**
 * @swagger
 * /destinations/{id}:
 *   put:
 *     summary: Update an existing destination
 *     tags: [Destinations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: Updated destination URL
 *                 example: "https://newsite.com"
 *               http_method:
 *                 type: string
 *                 enum: [GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS]
 *                 description: Updated HTTP method
 *               headers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   APP_ID: "1234APPID1234"
 *                   APP_SECRET: "enwdj3bshwer43bjhjs9ereuinkjcnsiurew8s"
 *                   ACTION: "user.update"
 *                   Content-Type: "application/json"
 *                   Accept: "*"
 *                 description: Updated headers as key-value pairs
 *     responses:
 *       200:
 *         description: Destination updated successfully
 *       400:
 *         description: Validation failed or no valid fields provided
 *       404:
 *         description: Destination not found
 *       409:
 *         description: Destination with same URL and HTTP method already exists
 */
router.put('/:id', destinationController.update);

/**
 * @swagger
 * /destinations/{id}:
 *   delete:
 *     summary: Delete a destination by ID
 *     tags: [Destinations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination ID
 *     responses:
 *       200:
 *         description: Destination deleted successfully
 *       400:
 *         description: Invalid destination ID format
 *       404:
 *         description: Destination not found
 */
router.delete('/:id', destinationController.delete);

module.exports = router;
