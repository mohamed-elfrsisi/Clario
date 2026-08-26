// src/controllers/user.controller.js
//
// WHY THIS FILE EXISTS:
// This is the translator between HTTP and the application. It reads
// what the client sent (req.query, req.params, req.body) and turns
// the service's answer into an HTTP response (status code + JSON).
//
// RESPONSIBILITY:
// - Read request input
// - Call the service to get real work done
// - Choose the HTTP status code
// - Send the response
//
// WHAT DOES NOT BELONG HERE:
// - SQL
// - `pool` from pg (the controller doesn't even import config/database.js)
// - Business rules (e.g. deciding what "counts" as a valid user)
//
// WHO CALLS THIS:
// Only the route layer (user.routes.js) wires these functions to a
// URL + HTTP method.
//
// WHAT IT RETURNS:
// Nothing (it sends the HTTP response directly via res.json()).

const userService = require("../services/user.service");

async function getUserCount(req, res) {
  try {
    const count = await userService.getUserCount();
    res.status(200).json({ count });
  } catch (err) {
    // We catch here (rather than letting it fall through to the
    // generic centralized error handler) because we want this
    // specific, safe DATABASE_ERROR shape for database failures -
    // never the raw PostgreSQL error, connection string, or stack
    // trace. The real error is logged server-side only.
    console.error("Failed to get user count:", err.message);
    res.status(500).json({
      error: {
        code: "DATABASE_ERROR",
        message: "Database operation failed",
      },
    });
  }
}

async function getUserByEmail(req, res) {
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
    const user = await userService.getUserByEmail(email);

    // The service told us "null" means no matching user. Deciding
    // that this becomes an HTTP 404 (as opposed to, say, a CLI tool
    // deciding to print "no results") is exactly the kind of decision
    // that belongs in the controller - it's about how THIS interface
    // (HTTP) communicates "not found," not about the underlying data.
    if (!user) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Failed to look up user by email:", err.message);
    res.status(500).json({
      error: {
        code: "DATABASE_ERROR",
        message: "Database operation failed",
      },
    });
  }
}

module.exports = {
  getUserCount,
  getUserByEmail,
};
