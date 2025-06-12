const express = require('express');
const router = express.Router();
const { verifyToken, hasRole } = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const { createDestinationSchema, updateDestinationSchema } = require('../validations/destination.validation');
const destinationController = require('../controllers/destinationController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Destination:
 *       type: object
 *       required:
 *         - account_id
 *         - url
 *         - http_method
 *         - headers
 *       properties:
 *         destination_id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated destination ID
 *         account_id:
 *           type: string
 *           format: uuid
 *           description: The ID of the account this destination belongs to
 *         url:
 *           type: string
 *           format: uri
 *           pattern: ^https?://
 *           description: The webhook destination URL (must start with http:// or https://)
 *         http_method:
 *           type: string
 *           enum: [GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS]
 *           description: The HTTP method to use for the webhook
 *         headers:
 *           type: object
 *           description: HTTP headers to include in the webhook request
 *           additionalProperties:
 *             type: string
 *             minProperties: 1
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         created_by:
 *           type: string
 *         updated_by:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Destinations
 *   description: Webhook destination management endpoints
 */

/**
 * @swagger
 * /destinations:
 *   get:
 *     summary: Get all destinations (Admin and Normal User)
 *     tags: [Destinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: account_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter destinations by account ID
 *     responses:
 *       200:
 *         description: List of destinations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 destinations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Destination'
 *       400:
 *         description: Invalid account ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, destinationController.getAll);

/**
 * @swagger
 * /destinations/{destination_id}:
 *   get:
 *     summary: Get destination by ID (Admin and Normal User)
 *     tags: [Destinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: destination_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Destination ID
 *     responses:
 *       200:
 *         description: Destination details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Destination'
 *       400:
 *         description: Invalid destination ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Destination not found
 *       500:
 *         description: Server error
 */
router.get('/:destination_id', verifyToken, destinationController.getById);

/**
 * @swagger
 * /destinations:
 *   post:
 *     summary: Create destination (Admin only)
 *     tags: [Destinations]
 *     security:
 *       - BearerAuth: []
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
 *                 description: The ID of the account this destination belongs to
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: The webhook destination URL (must start with http:// or https://)
 *               http_method:
 *                 type: string
 *                 enum: [GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS]
 *                 description: The HTTP method to use for the webhook
 *               headers:
 *                 type: object
 *                 description: HTTP headers to include in the webhook request
 *                 additionalProperties:
 *                   type: string
 *     responses:
 *       201:
 *         description: Destination created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Destination'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Account not found
 *       409:
 *         description: Duplicate destination
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, hasRole(['Admin']), validateRequest(createDestinationSchema), destinationController.create);

/**
 * @swagger
 * /destinations/{destination_id}:
 *   put:
 *     summary: Update destination (Admin and Normal User)
 *     tags: [Destinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: destination_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 format: uri
 *                 description: The webhook destination URL (must start with http:// or https://)
 *               http_method:
 *                 type: string
 *                 enum: [GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS]
 *                 description: The HTTP method to use for the webhook
 *               headers:
 *                 type: object
 *                 description: HTTP headers to include in the webhook request
 *                 additionalProperties:
 *                   type: string
 *     responses:
 *       200:
 *         description: Destination updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Destination'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Destination not found
 *       409:
 *         description: Duplicate destination
 *       500:
 *         description: Server error
 */
router.put('/:destination_id', verifyToken, validateRequest(updateDestinationSchema), destinationController.update);

/**
 * @swagger
 * /destinations/{destination_id}:
 *   delete:
 *     summary: Delete destination (Admin only)
 *     tags: [Destinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: destination_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Destination ID
 *     responses:
 *       200:
 *         description: Destination deleted
 *       400:
 *         description: Invalid destination ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Destination not found
 *       500:
 *         description: Server error
 */
router.delete('/:destination_id', verifyToken, hasRole(['Admin']), destinationController.delete);

module.exports = router;
