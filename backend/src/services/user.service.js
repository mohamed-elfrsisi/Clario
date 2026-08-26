// src/services/user.service.js
//
// WHY THIS FILE EXISTS:
// This is where "what does the application do" lives, separate from
// "how does HTTP work" (controller) and "how does SQL work" (repository).
//
// RESPONSIBILITY:
// Coordinate operations and apply application-level rules. Right now
// these functions are thin - they mostly just call the repository -
// because there's no real business logic yet. That's expected, not
// a sign we did something wrong. This layer becomes valuable once
// Clario adds things like registration rules, skill-gap calculations,
// or career alignment scoring: that logic will live here, and it will
// be callable from a controller, a script, or a test - without ever
// touching Express.
//
// WHAT DOES NOT BELONG HERE:
// - req, res, next (this file should work if you deleted Express
//   entirely and called these functions from plain Node.js)
// - HTTP status codes
// - SQL (that's the repository's job)
//
// WHO CALLS THIS:
// Only the controller layer (user.controller.js).
//
// WHAT IT RETURNS:
// Application-shaped data: a number for the count, a user object or
// null for the lookup. Notice getUserByEmail returns `null` instead
// of PostgreSQL's `undefined` - that's a small, deliberate translation
// from "database absence" to "application absence," so nothing above
// this layer needs to know that the data happens to come from
// PostgreSQL at all.

const userRepository = require("../repositories/user.repository");

async function getUserCount() {
  return userRepository.getUserCount();
}

async function getUserByEmail(email) {
  const user = await userRepository.getUserByEmail(email);

  // "Does this user exist?" is an application-level question, not a
  // raw database fact - the repository just reports what PostgreSQL
  // returned. The service is where we translate "no row" into a
  // clear application result (null). We deliberately do NOT decide
  // the HTTP status (404) here - that's the controller's job, since
  // HTTP status codes belong to the HTTP layer, not the application layer.
  return user || null;
}

module.exports = {
  getUserCount,
  getUserByEmail,
};
