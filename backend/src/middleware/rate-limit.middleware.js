// src/middleware/rate-limit.middleware.js
//
// Rate limiting for endpoints that are attractive targets for abuse
// (credential stuffing, brute force, registration spam). Limits are
// environment-aware so local development and automated tests are not
// throttled the same way production traffic would be.
//
// NOTE: express-rate-limit's default in-memory store is fine for a
// single-process deployment. If Clario ever runs multiple instances
// behind a load balancer, this should move to a shared store (e.g.
// Redis) so limits are enforced across instances - that's a
// deployment-topology change, not something to guess at here.

const rateLimit = require("express-rate-limit");
const AppError = require("../errors/app-error");

const isTest = process.env.NODE_ENV === "test";

// Shared handler so rate-limited requests go through the same
// centralized error shape as every other AppError response, instead
// of express-rate-limit's default plain-text body.
function rateLimitHandler(req, res, next) {
  next(
    new AppError(
      429,
      "TOO_MANY_REQUESTS",
      "Too many requests. Please try again later."
    )
  );
}

// Login/register are the classic brute-force / credential-stuffing
// targets: keep this tight. In test mode the limit is effectively
// disabled so the existing Phase 7 integration suite (which issues
// many requests in a tight loop) isn't affected.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isTest ? 100000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = {
  authLimiter,
};
