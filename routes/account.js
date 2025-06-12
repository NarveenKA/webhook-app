const express = require('express');
const router = express.Router();
const { verifyToken, hasRole } = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const { createAccountSchema, updateAccountSchema } = require('../validations/account.validation');
const accountController = require('../controllers/accountController');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

/**
 * @swagger
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       required:
 *         - account_name
 *       properties:
 *         account_id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated account ID
 *         account_name:
 *           type: string
 *           minLength: 2
 *           description: The name of the account
 *         website:
 *           type: string
 *           format: uri
 *           pattern: ^https?://
 *           description: The website URL (must start with http:// or https://)
 *           nullable: true
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
 *   name: Accounts
 *   description: Account management endpoints
 */

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Get all accounts (Admin and Normal User)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for account name
 *     responses:
 *       200:
 *         description: List of accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accounts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Account'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, cacheMiddleware('ACCOUNT'), accountController.getAll);

/**
 * @swagger
 * /accounts/{account_id}:
 *   get:
 *     summary: Get account by ID (Admin and Normal User)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.get('/:account_id', verifyToken, accountController.getById);

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create account (Admin only)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_name
 *             properties:
 *               account_name:
 *                 type: string
 *                 minLength: 2
 *                 description: Name of the account
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Website URL (must start with http:// or https://)
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, hasRole(['Admin']), validateRequest(createAccountSchema), clearCache('ACCOUNT'), accountController.create);

/**
 * @swagger
 * /accounts/{account_id}:
 *   put:
 *     summary: Update account (Admin and Normal User)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_name:
 *                 type: string
 *                 minLength: 2
 *                 description: Name of the account
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Website URL (must start with http:// or https://)
 *     responses:
 *       200:
 *         description: Account updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.put('/:account_id', verifyToken, validateRequest(updateAccountSchema), clearCache('ACCOUNT'), accountController.update);

/**
 * @swagger
 * /accounts/{account_id}:
 *   delete:
 *     summary: Delete account (Admin only)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.delete('/:account_id', verifyToken, hasRole(['Admin']), clearCache('ACCOUNT'), accountController.delete);

module.exports = router;
