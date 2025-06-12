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
 * /server/data:
 *   post:
 *     summary: Initial endpoint to receive JSON data and generate event ID
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
 *     responses:
 *       200:
 *         description: Data received and event ID generated
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
 *                       example: Data received successfully
 *                     event_id:
 *                       type: string
 *                       example: evt_123456789
 *       400:
 *         description: Bad Request - Invalid data format or missing JSON body
 *       401:
 *         description: Unauthorized - Missing or invalid secret token
 *       405:
 *         description: Method not allowed - Only POST requests are accepted
 *       500:
 *         description: Internal server error while processing data
 */
router.post('/data', dataHandlerController.receiveData);

/**
 * @swagger
 * /server/process:
 *   post:
 *     summary: Process previously received data and queue it for delivery to destinations
 *     tags: [IncomingData]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Optional additional processing parameters
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
 *         description: Event ID received from the initial data submission
 *     responses:
 *       202:
 *         description: Data queued for processing
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
 *                       example: Data queued for processing
 *                     event_id:
 *                       type: string
 *                       example: evt_123456789
 *                     account_id:
 *                       type: string
 *                       example: acc_123456789
 *       400:
 *         description: Bad Request - Missing event ID
 *       401:
 *         description: Unauthorized - Missing or invalid secret token
 *       404:
 *         description: No destinations found for this account or event not found
 *       405:
 *         description: Method not allowed - Only POST requests are accepted
 *       500:
 *         description: Internal server error while processing data
 */
router.post('/process', dataHandlerController.processData);

module.exports = router;
