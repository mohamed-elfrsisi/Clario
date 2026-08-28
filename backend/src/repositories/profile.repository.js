// src/repositories/profile.repository.js
//
// Profile data-access layer. SQL and PostgreSQL details belong here;
// HTTP/business decisions do not. Every query is parameterized -
// no user-controlled value is ever concatenated into SQL text.

const { pool } = require('../config/database');

async function findByUserId(userId) {
  const query = `
    SELECT profile_id, user_id, full_name, field_of_study, region,
           created_at, updated_at
    FROM profiles
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

async function findById(profileId) {
  const query = `
    SELECT profile_id, user_id, full_name, field_of_study, region,
           created_at, updated_at
    FROM profiles
    WHERE profile_id = $1
  `;

  const result = await pool.query(query, [profileId]);
  return result.rows[0] || null;
}

async function create(userId, { fullName, fieldOfStudy, region }) {
  const query = `
    INSERT INTO profiles (user_id, full_name, field_of_study, region)
    VALUES ($1, $2, $3, $4)
    RETURNING profile_id, user_id, full_name, field_of_study, region,
              created_at, updated_at
  `;

  const result = await pool.query(query, [
    userId,
    fullName ?? null,
    fieldOfStudy ?? null,
    region ?? null,
  ]);

  return result.rows[0];
}

async function updateByUserId(userId, { fullName, fieldOfStudy, region }) {
  // COALESCE keeps any field the caller omitted (undefined -> null
  // passed through as "no change") at its current DB value. The
  // service layer decides field presence; this only executes the SQL.
  const query = `
    UPDATE profiles
    SET full_name = COALESCE($2, full_name),
        field_of_study = COALESCE($3, field_of_study),
        region = COALESCE($4, region),
        updated_at = clock_timestamp()
    WHERE user_id = $1
    RETURNING profile_id, user_id, full_name, field_of_study, region,
              created_at, updated_at
  `;

  const result = await pool.query(query, [
    userId,
    fullName ?? null,
    fieldOfStudy ?? null,
    region ?? null,
  ]);

  return result.rows[0] || null;
}

module.exports = {
  findByUserId,
  findById,
  create,
  updateByUserId,
};
