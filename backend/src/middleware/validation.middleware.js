// src/middleware/validation.middleware.js
//
// Request-shape validation belongs before controllers. This keeps
// controllers focused on HTTP orchestration instead of repeating
// validation logic for every endpoint.

const AppError = require("../errors/app-error");

function validateUserEmailQuery(req, res, next) {
  const { email } = req.query;

  if (email === undefined) {
    return next(
      new AppError(400, "VALIDATION_ERROR", "Email is required")
    );
  }

  if (typeof email !== "string" || email.trim() === "") {
    return next(
      new AppError(400, "VALIDATION_ERROR", "Invalid email")
    );
  }

  const normalizedEmail = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    return next(
      new AppError(400, "VALIDATION_ERROR", "Invalid email")
    );
  }

  // Keep the normalized value available to the controller without
  // changing the public API contract.
  req.query.email = normalizedEmail;

  next();
}

module.exports = {
  validateUserEmailQuery,
};
