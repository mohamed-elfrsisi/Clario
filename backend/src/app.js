// src/app.js
//
// Configures the Express application. Server startup lives in server.js.

const express = require("express");
const { testConnection } = require("./config/database");
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const AppError = require("./errors/app-error");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Parse JSON request bodies.
app.use(express.json());

// Basic health check: verifies the HTTP application is alive.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "clario-backend",
  });
});

// Temporary learning endpoint from Phase 1.
app.post("/api/test", (req, res) => {
  const message = req.body.message;

  res.status(200).json({
    received: message,
  });
});

// Temporary learning endpoint used to demonstrate centralized error handling.
app.get("/api/test-error", (req, res) => {
  throw new Error("This is a deliberate test error");
});

// Authentication routes.
app.use("/api/auth", authRoutes);

// User routes.
app.use("/api/db/users", userRoutes);

// Database health check. It deliberately converts the low-level
// connectivity failure into an AppError so the central error handler
// controls the public response shape.
app.get("/api/health/db", async (req, res) => {
  const result = await testConnection();

  if (!result.connected) {
    console.error(
      "Database connectivity check failed:",
      result.error?.message
    );

    throw new AppError(
      500,
      "DATABASE_ERROR",
      "Database operation failed"
    );
  }

  res.status(200).json({
    status: "ok",
    database: "connected",
  });
});

// Route-level 404: this runs only after every real route above has had
// a chance to match the request.
app.use((req, res, next) => {
  next(new AppError(404, "NOT_FOUND", "Route not found"));
});

// Centralized error handler MUST be last.
app.use(errorHandler);

module.exports = app;
