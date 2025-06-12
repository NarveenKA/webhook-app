const express = require('express');
const router = express.Router();
const { verifyToken, hasRole } = require('../middleware/auth');
const accountMemberController = require('../controllers/accountMemberController');

/**
 * @swagger
 * tags:
 *   name: Account Members
 *   description: Account member management endpoints
 */

/**
 * @swagger
 * /account-members:
 *   get:
 *     summary: Get all account members (Admin and Normal User)
 *     tags: [Account Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: account_id
 *         schema:
 *           type: string
 *         description: Filter by account ID
 *     responses:
 *       200:
 *         description: List of account members
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, accountMemberController.getMembers);

/**
 * @swagger
 * /account-members/{member_id}:
 *   get:
 *     summary: Get account member by ID (Admin and Normal User)
 *     tags: [Account Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: member_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     responses:
 *       200:
 *         description: Account member details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Member not found
 *       500:
 *         description: Server error
 */
router.get('/:member_id', verifyToken, accountMemberController.getMemberById);

/**
 * @swagger
 * /account-members:
 *   post:
 *     summary: Create account member (Admin only)
 *     tags: [Account Members]
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
 *               - user_id
 *             properties:
 *               account_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account member created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, hasRole(['Admin']), accountMemberController.createMember);

/**
 * @swagger
 * /account-members/{member_id}:
 *   put:
 *     summary: Update account member (Admin only)
 *     tags: [Account Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: member_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Account member updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Member not found
 *       500:
 *         description: Server error
 */
router.put('/:member_id', verifyToken, hasRole(['Admin']), accountMemberController.updateMember);

/**
 * @swagger
 * /account-members/{member_id}:
 *   delete:
 *     summary: Delete account member (Admin only)
 *     tags: [Account Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: member_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account member deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Member not found
 *       500:
 *         description: Server error
 */
router.delete('/:member_id', verifyToken, hasRole(['Admin']), accountMemberController.deleteMember);

module.exports = router; 