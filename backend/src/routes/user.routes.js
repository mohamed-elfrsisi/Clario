// src/routes/user.routes.js
//
// Routes only map HTTP methods/paths to controllers and middleware.

const express = require("express");
const userController = require("../controllers/user.controller");
const {
  validateUserEmailQuery,
} = require("../middleware/validation.middleware");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

// SECURITY (Phase 8): both endpoints below previously had no
// authentication requirement at all. That let anyone - logged in or
// not - enumerate every registered email address and its role via
// GET /api/db/users/by-email, which directly undermines the
// deliberate "don't reveal whether an email is registered" behavior
// built into POST /api/auth/login. requireAuth is the smallest fix
// that closes the anonymous enumeration path while preserving the
// endpoints for authenticated API consumers/tests.
router.get("/count", requireAuth, userController.getUserCount);

router.get(
  "/by-email",
  requireAuth,
  validateUserEmailQuery,
  userController.getUserByEmail
);

module.exports = router;
