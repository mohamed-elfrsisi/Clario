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
const { pool, testConnection } = require("./config/database");

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
// PHASE 2 - Database routes
// ------------------------------------------------------------------
// These routes talk to PostgreSQL directly through the shared pool.
// We are NOT introducing controllers/services/repositories yet -
// that refactor belongs to Phase 3. For now it's fine for a route
// handler to call pool.query() directly.

// Confirms PostgreSQL is reachable. Does not expose host/user/password.
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

// LEARNING ENDPOINT: first real query against the existing `users` table.
// Demonstrates async/await with pool.query().
app.get("/api/db/users/count", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) AS count FROM users");

    // pool.query() returns rows as an array. COUNT(*) always returns
    // exactly one row. PostgreSQL sends COUNT back as a string (it can
    // exceed JS's safe integer range for very large tables), so we
    // convert it to a number here.
    const count = Number(result.rows[0].count);

    res.status(200).json({ count });
  } catch (err) {
    console.error("Failed to count users:", err.message);
    res.status(500).json({
      error: {
        code: "DATABASE_ERROR",
        message: "Database operation failed",
      },
    });
  }
});

// LEARNING ENDPOINT: parameterized query using a value from the client
// (req.query.email, i.e. the "?email=..." part of the URL).
//
// IMPORTANT: We NEVER build SQL like this:
//   `SELECT * FROM users WHERE email = '${email}'`
// That lets an attacker send something like:  ' OR '1'='1
// which changes the query's logic and could return every row in the
// table. Instead we use a placeholder ($1) and pass the real value
// separately - PostgreSQL treats it strictly as data, never as SQL.
app.get("/api/db/users/by-email", async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Query parameter 'email' is required",
      },
    });
  }

  try {
    const query = `
      SELECT user_id, email, role
      FROM users
      WHERE email = $1
    `;
    const values = [email];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Only ever return safe columns. password_hash is never selected
    // above, so there is no risk of accidentally leaking it here.
    res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error("Failed to look up user by email:", err.message);
    res.status(500).json({
      error: {
        code: "DATABASE_ERROR",
        message: "Database operation failed",
      },
    });
  }
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
