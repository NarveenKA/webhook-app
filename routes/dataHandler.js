const express = require('express');
const router = express.Router();
const dataHandlerController = require('../controllers/dataHandlerController');

/**
 * @swagger
 * tags:
 *   name: IncomingData
 *   description: API endpoints for managing data. 
 */

/**
 * @swagger
 * /server/incoming_data:
 *   post:
 *     summary: Dispatch incoming data to all destinations based on account token
 *     tags: [IncomingData]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               account_name: "New account"
 *               url: "http://newsite.com"
 *     parameters:
 *       - in: header
 *         name: CL-X-TOKEN
 *         required: true
 *         schema:
 *           type: string
 *         description: Secret token to authenticate the account
 *     responses:
 *       200:
 *         description: Data dispatched successfully to destinations
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
 *                       example: Data dispatched to destinations
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           destination:
 *                             type: string
 *                             example: https://api.example.com/endpoint
 *                           status:
 *                             type: string
 *                             example: success
 *                           statusCode:
 *                             type: integer
 *                             example: 200
 *       400:
 *         description: Invalid data format or missing JSON body
 *       401:
 *         description: Un Authenticate - Missing or invalid secret token
 *       404:
 *         description: No destinations found for this account
 *       500:
 *         description: Internal server error while processing incoming data
 */
router.post('/incoming_data', dataHandlerController.incomingData);

module.exports = router;
