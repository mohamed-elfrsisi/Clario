// src/app.js
//
// Configures the Express application. Server startup lives in server.js.

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { testConnection } = require("./config/database");
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const skillRoutes = require("./routes/skill.routes");
const experienceRoutes = require("./routes/experience.routes");
const educationRoutes = require("./routes/education.routes");
const certificationRoutes = require("./routes/certification.routes");
const documentRoutes = require("./routes/document.routes");
const projectRoutes = require("./routes/project.routes");
const AppError = require("./errors/app-error");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Standard HTTP security headers (X-Content-Type-Options, X-Frame-Options
// equivalent via CSP frame-ancestors, Referrer-Policy, etc). Safe to
// enable unconditionally - Clario currently serves a JSON API only, so
// helmet's defaults don't affect any HTML rendering.
app.use(helmet());

// CORS is opt-in via CORS_ORIGIN. With no value set, Express sends no
// CORS headers at all, which means browsers already deny cross-origin
// requests by default - that's the correct secure default until a real
// frontend origin exists. We deliberately do NOT default to "*" for an
// authenticated, cookie-based API, and we don't invent a production
// domain here. Set CORS_ORIGIN (comma-separated for multiple origins)
// once the frontend's real origin is known.
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (corsOrigins.length > 0) {
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true, // requests authenticate via HttpOnly cookie
    })
  );
}

// Parse JSON request bodies. A body size limit guards against
// oversized-payload abuse on every JSON endpoint.
app.use(express.json({ limit: "100kb" }));

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

// Profile routes (includes profile-scoped /me/skills sub-resource).
app.use("/api/profiles", profileRoutes);

// Shared skills reference list.
app.use("/api/skills", skillRoutes);

// Experiences (work history) and their skill relationships.
app.use("/api/experiences", experienceRoutes);
app.use("/api/projects", projectRoutes);

// Education history.
app.use("/api/educations", educationRoutes);

// Professional certifications.
app.use("/api/certifications", certificationRoutes);

// Document metadata (no object storage integration exists yet - see
// document.service.js for the exact scope of what this covers).
app.use("/api/documents", documentRoutes);

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
