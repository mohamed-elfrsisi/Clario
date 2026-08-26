// src/errors/app-error.js
//
// A small, predictable error type for errors that are safe for the API
// to expose. It carries the HTTP status and machine-readable error code,
// while the centralized error middleware decides how to format the response.

class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace?.(this, AppError);
  }
}

module.exports = AppError;
