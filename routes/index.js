const express = require("express");
const router = express.Router();
const { verifyToken, hasRole } = require("../middleware/auth");

// Import individual route modules
const authRoutes = require("./auth");
const accountRoutes = require("./account");
const destinationRoutes = require("./destination");
const dataHandlerRoutes = require("./dataHandler");
const userRoutes = require("./user");
const roleRoutes = require("./roles");
const logRoutes = require("./log");
const accountMemberRoutes = require("./accountMember");

// Public routes
router.use("/auth", authRoutes);

// Protected routes with role-based access
router.use("/roles", verifyToken, hasRole(['Admin']), roleRoutes);
router.use("/users", verifyToken, hasRole(['Admin']), userRoutes);

// Account routes - Admin: Full CRUD, Normal User: Read/Update only
router.use("/accounts", verifyToken, accountRoutes);

// Destination routes - Admin: Full CRUD, Normal User: Read/Update only
router.use("/destinations", verifyToken, destinationRoutes);

// Account member routes - Admin: Full CRUD, Normal User: Read only
router.use("/account-members", verifyToken, accountMemberRoutes);

// Log routes - Admin: Read, Normal User: Read
router.use("/logs", verifyToken, hasRole(['Admin', 'Normal User']), logRoutes);

// Data handler routes (webhook endpoints)
router.use("/server", dataHandlerRoutes);

module.exports = router;
