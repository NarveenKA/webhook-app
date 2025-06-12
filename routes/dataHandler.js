const express = require('express');
const router = express.Router();
const dataHandlerController = require('../controllers/dataHandlerController');

/**
 * @swagger
 * tags:
 *   name: IncomingData
 *   description: API endpoints for handling incoming webhook data
 */

/**
 * @swagger
 * /server/incoming_data:
 *   post:
 *     summary: Process incoming webhook data and queue it for delivery to destinations
 *     tags: [IncomingData]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Any valid JSON object
 *     parameters:
 *       - in: header
 *         name: CL-X-TOKEN
 *         required: true
 *         schema:
 *           type: string
 *         description: Secret token to authenticate the account
 *       - in: header
 *         name: CL-X-EVENT-ID
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for this webhook event
 *     responses:
 *       202:
 *         description: Data accepted for processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Data accepted for processing
 *                     event_id:
 *                       type: string
 *                       example: evt_123456789
 *       400:
 *         description: Bad Request - Invalid data format, missing JSON body, or missing event ID
 *       401:
 *         description: Unauthorized - Missing or invalid secret token
 *       404:
 *         description: No destinations found for this account
 *       405:
 *         description: Method not allowed - Only POST requests are accepted
 *       500:
 *         description: Internal server error while processing incoming data
 */
router.post('/incoming_data', dataHandlerController.incomingData);

module.exports = router;
