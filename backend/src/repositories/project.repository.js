// src/repositories/project.repository.js
//
// Mirrors experience.repository.js's shape/conventions exactly. Every
// function accepts an optional `executor` (defaults to the shared
// pool) so callers running inside withTransaction() can pass the
// transaction's dedicated client instead.

const { pool } = require('../config/database');

async function listForProfile(profileId, { limit, offset }, executor = pool) {
  const query = `
    SELECT project_id, profile_id, title, description, start_date, end_date,
           url, created_at, updated_at
    FROM projects
    WHERE profile_id = $1
    ORDER BY start_date DESC NULLS LAST, created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await executor.query(query, [profileId, limit, offset]);
  return result.rows;
}

// Returns the row ONLY if it belongs to profileId - the ownership
// check every read/update/delete relies on. A mismatch (wrong profile
// OR nonexistent row) returns null either way, so the service layer
// can turn both into an identical 404.
async function findOwned(projectId, profileId, executor = pool) {
  const query = `
    SELECT project_id, profile_id, title, description, start_date, end_date,
           url, created_at, updated_at
    FROM projects
    WHERE project_id = $1 AND profile_id = $2
  `;

  const result = await executor.query(query, [projectId, profileId]);
  return result.rows[0] || null;
}

async function create(profileId, { title, description, startDate, endDate, url }, executor = pool) {
  const query = `
    INSERT INTO projects (profile_id, title, description, start_date, end_date, url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING project_id, profile_id, title, description, start_date, end_date,
              url, created_at, updated_at
  `;

  const result = await executor.query(query, [
    profileId,
    title,
    description ?? null,
    startDate ?? null,
    endDate ?? null,
    url ?? null,
  ]);

  return result.rows[0];
}

async function updateOwned(projectId, profileId, fields, executor = pool) {
  const { title, description, startDate, endDate, url } = fields;

  // start_date, end_date, and url are all nullable columns a caller may
  // legitimately want to clear back to NULL - COALESCE can't tell
  // "omitted" from "explicitly null" for those, so each gets an
  // explicit "was this key present?" flag, same pattern as
  // experience.repository.js's end_date handling.
  const startDateProvided = startDate !== undefined;
  const endDateProvided = endDate !== undefined;
  const urlProvided = url !== undefined;

  const query = `
    UPDATE projects
    SET title = COALESCE($3, title),
        description = COALESCE($4, description),
        start_date = CASE WHEN $5 THEN $6 ELSE start_date END,
        end_date = CASE WHEN $7 THEN $8 ELSE end_date END,
        url = CASE WHEN $9 THEN $10 ELSE url END,
        updated_at = clock_timestamp()
    WHERE project_id = $1 AND profile_id = $2
    RETURNING project_id, profile_id, title, description, start_date, end_date,
              url, created_at, updated_at
  `;

  const result = await executor.query(query, [
    projectId,
    profileId,
    title ?? null,
    description ?? null,
    startDateProvided,
    startDateProvided ? startDate : null,
    endDateProvided,
    endDateProvided ? endDate : null,
    urlProvided,
    urlProvided ? url : null,
  ]);

  return result.rows[0] || null;
}

async function deleteOwned(projectId, profileId, executor = pool) {
  const query = `
    DELETE FROM projects
    WHERE project_id = $1 AND profile_id = $2
    RETURNING project_id
  `;

  const result = await executor.query(query, [projectId, profileId]);
  return result.rows.length > 0;
}

// --- project_skills (junction) -----------------------------------------

async function listSkills(projectId, executor = pool) {
  const query = `
    SELECT s.skill_id, s.skill_name
    FROM project_skills ps
    JOIN skills s ON s.skill_id = ps.skill_id
    WHERE ps.project_id = $1
    ORDER BY s.skill_name ASC
  `;

  const result = await executor.query(query, [projectId]);
  return result.rows;
}

async function addSkill(projectId, skillId, executor = pool) {
  const query = `
    INSERT INTO project_skills (project_id, skill_id)
    VALUES ($1, $2)
    ON CONFLICT (project_id, skill_id) DO NOTHING
    RETURNING project_id, skill_id
  `;

  const result = await executor.query(query, [projectId, skillId]);
  return result.rows[0] || null;
}

async function removeSkill(projectId, skillId, executor = pool) {
  const query = `
    DELETE FROM project_skills
    WHERE project_id = $1 AND skill_id = $2
    RETURNING project_id, skill_id
  `;

  const result = await executor.query(query, [projectId, skillId]);
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
