// Authentication data-access layer.
// SQL and PostgreSQL details belong here; HTTP/business decisions do not.

const { pool } = require('../config/database');

async function findUserByEmail(email) {
  const query = `
    SELECT user_id, email, password_hash
    FROM users
    WHERE email = $1
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

async function createUser(email, passwordHash) {
  const query = `
    INSERT INTO users (email, password_hash)
    VALUES ($1, $2)
    RETURNING user_id, email, created_at, updated_at
  `;

  const result = await pool.query(query, [email, passwordHash]);
  return result.rows[0];
}

module.exports = {
  findUserByEmail,
  createUser,
};
