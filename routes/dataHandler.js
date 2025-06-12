const express = require('express');
const router = express.Router();
const { dataRouteLimiter } = require('../middleware/rateLimiter');
const dataHandlerController = require('../controllers/dataHandlerController');

/**
 * @swagger
 * tags:
 *   name: Data Handler
 *   description: Data receiving and processing endpoints
 */

/**
 * @swagger
 * /server/data:
 *   post:
 *     summary: Receive initial data and generate event ID
 *     tags: [Data Handler]
 *     parameters:
 *       - in: header
 *         name: CL-X-TOKEN
 *         required: true
 *         schema:
 *           type: string
 *         description: Authentication token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Data received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     event_id:
 *                       type: string
 *                       format: uuid
 *       401:
 *         description: Missing authentication token
 *       429:
 *         description: Too many requests from this IP
 *       500:
 *         description: Server error
 */
router.post('/data', dataRouteLimiter, dataHandlerController.receiveData);

/**
 * @swagger
 * /server/process:
 *   post:
 *     summary: Process data with event ID
 *     tags: [Data Handler]
 *     parameters:
 *       - in: header
 *         name: CL-X-TOKEN
 *         required: true
 *         schema:
 *           type: string
 *         description: Authentication token
 *       - in: header
 *         name: CL-X-EVENT-ID
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID from the initial data submission
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     event_ids:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uuid
 *                     account_id:
 *                       type: string
 *                       format: uuid
 *                     destination_count:
 *                       type: integer
 *       401:
 *         description: Missing authentication token or event ID
 *       404:
 *         description: Event data not found
 *       500:
 *         description: Server error
 */
router.post('/process', dataHandlerController.processData);

module.exports = router;
