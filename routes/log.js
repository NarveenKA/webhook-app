const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const validateQuery = require('../middleware/validateQuery');
const { getLogsQuerySchema } = require('../validations/log.validation');
const logController = require('../controllers/logController');

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Log management endpoints
 */

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Get all logs (Admin and Normal User)
 *     tags: [Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: account_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter logs by account ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of logs
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, validateQuery(getLogsQuerySchema), logController.getLogs);

/**
 * @swagger
 * /logs/{event_id}:
 *   get:
 *     summary: Get log by event ID (Admin and Normal User)
 *     tags: [Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID of the log
 *     responses:
 *       200:
 *         description: Log details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Log not found
 *       500:
 *         description: Server error
 */
router.get('/:event_id', verifyToken, logController.getLogById);

module.exports = router; 