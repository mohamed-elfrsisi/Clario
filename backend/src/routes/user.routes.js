// src/routes/user.routes.js
//
// WHY THIS FILE EXISTS:
// This is the map from "HTTP method + URL" to "which controller
// function handles it." Nothing more.
//
// RESPONSIBILITY:
// Declare routes and connect them to controller functions.
//
// WHAT DOES NOT BELONG HERE:
// - SQL
// - Business logic
// - Reading req.query/req.body and doing anything with it
//   (that's the controller's job)
//
// WHO CALLS THIS:
// It's mounted into the main app in src/app.js via app.use(...).
//
// WHAT IT RETURNS:
// An Express Router instance - not data, not JSON. This file never
// runs on its own; it just describes routing rules.

const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

// Full path once mounted (see app.js): GET /api/db/users/count
router.get("/count", userController.getUserCount);

// Full path once mounted (see app.js): GET /api/db/users/by-email
router.get("/by-email", userController.getUserByEmail);

module.exports = router;
