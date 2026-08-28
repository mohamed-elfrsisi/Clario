// src/repositories/experience.repository.js
//
// Every function accepts an optional `executor` (defaults to the
// shared pool) so callers running inside withTransaction() can pass
// the transaction's dedicated client instead, keeping every statement
// of a multi-table write on the same connection/transaction.

const { pool } = require('../config/database');

async function listForProfile(profileId, { limit, offset }, executor = pool) {
  const query = `
    SELECT experience_id, profile_id, title, company, start_date, end_date,
           description, created_at, updated_at
    FROM experiences
    WHERE profile_id = $1
    ORDER BY start_date DESC, created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await executor.query(query, [profileId, limit, offset]);
  return result.rows;
}

// Returns the row ONLY if it belongs to profileId - this is the
// ownership check every read/update/delete relies on. A mismatch
// (wrong profile OR nonexistent row) returns null either way, so the
// service layer can turn both into an identical 404.
async function findOwned(experienceId, profileId, executor = pool) {
  const query = `
    SELECT experience_id, profile_id, title, company, start_date, end_date,
           description, created_at, updated_at
    FROM experiences
    WHERE experience_id = $1 AND profile_id = $2
  `;

  const result = await executor.query(query, [experienceId, profileId]);
  return result.rows[0] || null;
}

async function create(profileId, { title, company, startDate, endDate, description }, executor = pool) {
  const query = `
    INSERT INTO experiences (profile_id, title, company, start_date, end_date, description)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING experience_id, profile_id, title, company, start_date, end_date,
              description, created_at, updated_at
  `;

  const result = await executor.query(query, [
    profileId,
    title,
    company ?? null,
    startDate,
    endDate ?? null,
    description ?? null,
  ]);

  return result.rows[0];
}

async function updateOwned(experienceId, profileId, fields, executor = pool) {
  const { title, company, startDate, endDate, description } = fields;

  const query = `
    UPDATE experiences
    SET title = COALESCE($3, title),
        company = COALESCE($4, company),
        start_date = COALESCE($5, start_date),
        end_date = CASE WHEN $6 THEN $7 ELSE end_date END,
        description = COALESCE($8, description),
        updated_at = clock_timestamp()
    WHERE experience_id = $1 AND profile_id = $2
    RETURNING experience_id, profile_id, title, company, start_date, end_date,
              description, created_at, updated_at
  `;

  // end_date is the one nullable field a caller may legitimately want
  // to clear back to NULL (an ongoing role becoming "no longer
  // ongoing" is set elsewhere; clearing it means "still ongoing").
  // COALESCE can't distinguish "omitted" from "explicitly null" for a
  // nullable column, so it gets an explicit "was this key present?"
  // flag ($6) instead.
  const endDateProvided = endDate !== undefined;

  const result = await executor.query(query, [
    experienceId,
    profileId,
    title ?? null,
    company ?? null,
    startDate ?? null,
    endDateProvided,
    endDateProvided ? endDate : null,
    description ?? null,
  ]);

  return result.rows[0] || null;
}

async function deleteOwned(experienceId, profileId, executor = pool) {
  const query = `
    DELETE FROM experiences
    WHERE experience_id = $1 AND profile_id = $2
    RETURNING experience_id
  `;

  const result = await executor.query(query, [experienceId, profileId]);
  return result.rows.length > 0;
}

// --- experience_skills (junction) --------------------------------------

async function listSkills(experienceId, executor = pool) {
  const query = `
    SELECT s.skill_id, s.skill_name
    FROM experience_skills es
    JOIN skills s ON s.skill_id = es.skill_id
    WHERE es.experience_id = $1
    ORDER BY s.skill_name ASC
  `;

  const result = await executor.query(query, [experienceId]);
  return result.rows;
}

async function addSkill(experienceId, skillId, executor = pool) {
  const query = `
    INSERT INTO experience_skills (experience_id, skill_id)
    VALUES ($1, $2)
    ON CONFLICT (experience_id, skill_id) DO NOTHING
    RETURNING experience_id, skill_id
  `;

  const result = await executor.query(query, [experienceId, skillId]);
  return result.rows[0] || null;
}

async function removeSkill(experienceId, skillId, executor = pool) {
  const query = `
    DELETE FROM experience_skills
    WHERE experience_id = $1 AND skill_id = $2
    RETURNING experience_id, skill_id
  `;

  const result = await executor.query(query, [experienceId, skillId]);
  return result.rows[0] || null;
}

module.exports = {
  listForProfile,
  findOwned,
  create,
  updateOwned,
  deleteOwned,
  listSkills,
  addSkill,
  removeSkill,
};
