// src/app.js
//
// This file configures the Express application: middleware, routes,
// 404 handling, and error handling.
//
// It does NOT start the server (listen on a port). That happens in
// server.js. Keeping "app configuration" separate from "server startup"
// means we can later test app.js (e.g. with supertest) without actually
// opening a network port, and it makes it obvious where each concern lives.

const express = require("express");
const { testConnection } = require("./config/database");
const userRoutes = require("./routes/user.routes");

const app = express();

// ------------------------------------------------------------------
// Middleware
// ------------------------------------------------------------------

// Parses incoming requests with a JSON body (e.g. POST /api/test)
// and makes the result available as req.body.
app.use(express.json());

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------

// Health check: confirms the HTTP server is alive.
// Intentionally does NOT touch a database - Phase 1 has no database.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "clario-backend",
  });
});

// TEMPORARY / LEARNING ENDPOINT ONLY.
// Demonstrates express.json() parsing a request body.
// This is not a real Clario feature and will be removed once we no
// longer need it for learning/testing.
app.post("/api/test", (req, res) => {
  const message = req.body.message;
  res.status(200).json({
    received: message,
  });
});

// TEMPORARY / LEARNING ENDPOINT ONLY.
// Deliberately throws an error so we can see the error-handling
// middleware below in action. Not a real Clario feature.
app.get("/api/test-error", (req, res, next) => {
  try {
    throw new Error("This is a deliberate test error");
  } catch (err) {
    next(err); // hand the error off to Express's error-handling middleware
  }
});

// ------------------------------------------------------------------
// PHASE 3 - Layered user routes
// ------------------------------------------------------------------
// GET /api/db/users/count and GET /api/db/users/by-email used to be
// defined inline right here, calling `pool.query()` directly (Phase 2).
// They've been refactored into:
//   src/routes/user.routes.js       (routing)
//   src/controllers/user.controller.js (HTTP layer)
//   src/services/user.service.js       (application logic)
//   src/repositories/user.repository.js (SQL / pg pool)
// app.js no longer knows these endpoints run any SQL at all - it just
// mounts the router under a path prefix.
app.use("/api/db/users", userRoutes);

// /api/health/db stays here: it's a system-level check (is PostgreSQL
// reachable at all?), not a "users" concern, so it doesn't belong in
// the user layers above. It still only uses the safe testConnection()
// helper from config/database.js, never the pool directly.
app.get("/api/health/db", async (req, res) => {
  const result = await testConnection();

  if (result.connected) {
    return res.status(200).json({
      status: "ok",
      database: "connected",
    });
  }

  // Log the real error on the server only - never send connection
  // details, hostnames, or credentials back to the client.
  console.error("Database connectivity check failed:", result.error.message);

  return res.status(500).json({
    error: {
      code: "DATABASE_ERROR",
      message: "Database operation failed",
    },
  });
});

// ------------------------------------------------------------------
// 404 handler
// ------------------------------------------------------------------
// This runs if a request doesn't match any route defined above.
// It must be registered AFTER all real routes.
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

// ------------------------------------------------------------------
// Centralized error handler
// ------------------------------------------------------------------
// Express recognizes this as an error handler because it takes 4
// arguments (err, req, res, next). It must be registered LAST.
// Any call to next(err) anywhere in the app ends up here.
app.use((err, req, res, next) => {
  // Log the real error on the server for debugging.
  console.error(err);

  // Never leak stack traces or internal details to the client.
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
});

module.exports = app;
