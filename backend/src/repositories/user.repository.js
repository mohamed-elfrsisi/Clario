// src/repositories/user.repository.js
//
// WHY THIS FILE EXISTS:
// This is the only place in the whole app allowed to write SQL or
// touch the `pool` directly for user-related data. If we ever need
// to know exactly what query runs against the `users` table, this
// is the one file to check.
//
// RESPONSIBILITY:
// Talk to PostgreSQL, return plain JavaScript data (rows/objects).
// Nothing else.
//
// WHAT DOES NOT BELONG HERE:
// - Express (no req, res, next)
// - HTTP status codes
// - "not found" decisions (see note in getUserByEmail below)
// - business rules
//
// WHO CALLS THIS:
// Only the service layer (user.service.js) calls into this file.
// Controllers and routes never import this directly - that would
// skip the layers in between and defeat the point of having them.
//
// WHAT IT RETURNS:
// Raw query results: a plain number for the count, a plain row
// object (or undefined) for a single user. No HTTP shape at all -
// that's the controller's job, later.

const { pool } = require("../config/database");

async function getUserCount() {
  const result = await pool.query("SELECT COUNT(*) AS count FROM users");

  // PostgreSQL returns COUNT as a string (it can exceed JS's safe
  // integer range for very large tables). We convert here because
  // this is the layer that understands PostgreSQL's quirks - the
  // service layer shouldn't have to know that detail.
  return Number(result.rows[0].count);
}

async function getUserByEmail(email) {
  // Parameterized query: $1 is a placeholder, `email` is passed
  // separately in the values array. PostgreSQL treats it strictly
  // as data, never as SQL syntax - this is what prevents SQL
  // injection, regardless of what the caller passes in.
  const query = `
    SELECT user_id, email, role
    FROM users
    WHERE email = $1
  `;
  const values = [email];

  const result = await pool.query(query, values);

  // NOTE: we deliberately do NOT decide "not found" here in the
  // sense of throwing a USER_NOT_FOUND error or picking an HTTP
  // status. That's an application-level decision, not a data-access
  // one - see user.service.js. This function just tells the truth
  // about what PostgreSQL returned: a row, or undefined if there
  // wasn't one.
  return result.rows[0]; // undefined if no matching row
}

module.exports = {
  getUserCount,
  getUserByEmail,
};
