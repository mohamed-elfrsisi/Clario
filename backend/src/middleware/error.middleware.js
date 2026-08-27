// src/middleware/error.middleware.js
//
// The single place where application errors become HTTP responses.
// Controllers and repositories should not duplicate response formatting.

const AppError = require("../errors/app-error");

function isPostgresError(err) {
  // PostgreSQL/pg errors normally expose a `code` property. Some
  // connection failures use Node network codes such as ECONNREFUSED.
  // We intentionally use a conservative check so ordinary AppErrors
  // are never mislabeled as database errors.
  return Boolean(
    err &&
      typeof err.code === "string" &&
      (err.severity ||
        /^[0-9]{5}$/.test(err.code) ||
        [
          "ECONNREFUSED",
          "ECONNRESET",
          "ETIMEDOUT",
          "ENOTFOUND",
        ].includes(err.code))
  );
}

// express.json() (via body-parser) throws http-errors instances for
// things like an oversized body or malformed JSON. Those carry a safe,
// pre-defined `status`/`statusCode` and an `expose: true` flag meaning
// the message itself was written to be client-safe - unlike an
// arbitrary thrown Error, which might contain internal details.
function isSafeHttpError(err) {
  return Boolean(
    err &&
      err.expose === true &&
      typeof (err.statusCode || err.status) === "number"
  );
}

const HTTP_ERROR_CODES = {
  400: "BAD_REQUEST",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
};

function errorHandler(err, req, res, next) {
  // `next` is part of Express's error-handler signature. It is kept in
  // the signature intentionally, even though this handler normally ends
  // the request itself.
  void next;

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  if (isSafeHttpError(err)) {
    const statusCode = err.statusCode || err.status;

    return res.status(statusCode).json({
      error: {
        code: HTTP_ERROR_CODES[statusCode] || "REQUEST_ERROR",
        message: err.message,
      },
    });
  }

  if (isPostgresError(err)) {
    console.error("Database error:", err.message);

    return res.status(500).json({
      error: {
        code: "DATABASE_ERROR",
        message: "Database operation failed",
      },
    });
  }

  // Log the real error server-side for debugging, but never expose
  // stack traces or internal implementation details to the client.
  console.error("Unhandled application error:", err);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
}

module.exports = errorHandler;
