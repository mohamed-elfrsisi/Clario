// src/repositories/education.repository.js
//
// Every function accepts an optional `executor` (defaults to the
// shared pool), matching the pattern used elsewhere for callers that
// need to run inside a transaction.

const { pool } = require('../config/database');

async function listForProfile(profileId, { limit, offset }, executor = pool) {
  const query = `
    SELECT education_id, profile_id, degree, institution, start_date, end_date,
           description, created_at, updated_at
    FROM educations
    WHERE profile_id = $1
    ORDER BY start_date DESC NULLS LAST, created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await executor.query(query, [profileId, limit, offset]);
  return result.rows;
}

// Returns the row ONLY if it belongs to profileId - the ownership
// check every read/update/delete relies on.
async function findOwned(educationId, profileId, executor = pool) {
  const query = `
    SELECT education_id, profile_id, degree, institution, start_date, end_date,
           description, created_at, updated_at
    FROM educations
    WHERE education_id = $1 AND profile_id = $2
  `;

  const result = await executor.query(query, [educationId, profileId]);
  return result.rows[0] || null;
}

async function create(profileId, { degree, institution, startDate, endDate, description }, executor = pool) {
  const query = `
    INSERT INTO educations (profile_id, degree, institution, start_date, end_date, description)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING education_id, profile_id, degree, institution, start_date, end_date,
              description, created_at, updated_at
  `;

  const result = await executor.query(query, [
    profileId,
    degree ?? null,
    institution ?? null,
    startDate ?? null,
    endDate ?? null,
    description ?? null,
  ]);

  return result.rows[0];
}

async function updateOwned(educationId, profileId, fields, executor = pool) {
  const { degree, institution, startDate, endDate, description } = fields;

  // start_date and end_date are both nullable columns, so (like
  // experiences.end_date) COALESCE can't tell "field omitted" apart
  // from "field explicitly set to null". Both get an explicit
  // "was this key present in the request?" flag.
  const startDateProvided = startDate !== undefined;
  const endDateProvided = endDate !== undefined;

  const query = `
    UPDATE educations
    SET degree = COALESCE($3, degree),
        institution = COALESCE($4, institution),
        start_date = CASE WHEN $5 THEN $6 ELSE start_date END,
        end_date = CASE WHEN $7 THEN $8 ELSE end_date END,
        description = COALESCE($9, description),
        updated_at = clock_timestamp()
    WHERE education_id = $1 AND profile_id = $2
    RETURNING education_id, profile_id, degree, institution, start_date, end_date,
              description, created_at, updated_at
  `;

  const result = await executor.query(query, [
    educationId,
    profileId,
    degree ?? null,
    institution ?? null,
    startDateProvided,
    startDateProvided ? startDate : null,
    endDateProvided,
    endDateProvided ? endDate : null,
    description ?? null,
  ]);

  return result.rows[0] || null;
}

async function deleteOwned(educationId, profileId, executor = pool) {
  const query = `
    DELETE FROM educations
    WHERE education_id = $1 AND profile_id = $2
    RETURNING education_id
  `;

  const result = await executor.query(query, [educationId, profileId]);
  return result.rows.length > 0;
}

module.exports = {
  listForProfile,
  findOwned,
  create,
  updateOwned,
  deleteOwned,
};
