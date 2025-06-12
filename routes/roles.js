const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const roleController = require('../controllers/roleController');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management endpoints
 */

/**
 * @swagger
 * /roles/assign:
 *   post:
 *     summary: Assign role to user (Admin only)
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - role_name
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               role_name:
 *                 type: string
 *                 enum: [Admin, Normal User]
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User or role not found
 *       500:
 *         description: Server error
 */
router.post('/assign', verifyToken, isAdmin, roleController.assignRole);

module.exports = router; 