// src/routes/user.routes.js
//
// Routes only map HTTP methods/paths to controllers and middleware.

const express = require("express");
const userController = require("../controllers/user.controller");
const {
  validateUserEmailQuery,
} = require("../middleware/validation.middleware");

const router = express.Router();

router.get("/count", userController.getUserCount);

router.get(
  "/by-email",
  validateUserEmailQuery,
  userController.getUserByEmail
);

module.exports = router;
