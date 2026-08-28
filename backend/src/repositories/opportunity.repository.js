// src/repositories/opportunity.repository.js
// Data access for shared opportunities and their skills.
// Opportunities are explicitly NOT user-owned in the database schema.
// Parameterized SQL only; no request object is passed into this layer.

const { pool } = require('../config/database');

const OPPORTUNITY_COLUMNS = `
  opportunity_id, title, organization, description, job_url,
  region, role_type, created_at, updated_at
`;

async function list({ limit, offset }, executor = pool) {
  const result = await executor.query(
    `SELECT ${OPPORTUNITY_COLUMNS}
     FROM opportunities
     ORDER BY created_at DESC, opportunity_id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

async function findById(opportunityId, executor = pool) {
  const result = await executor.query(
    `SELECT ${OPPORTUNITY_COLUMNS}
     FROM opportunities
     WHERE opportunity_id = $1`,
    [opportunityId]
  );
  return result.rows[0] || null;
}

async function create(fields, executor = pool) {
  const result = await executor.query(
    `INSERT INTO opportunities
       (title, organization, description, job_url, region, role_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${OPPORTUNITY_COLUMNS}`,
    [
      fields.title,
      fields.organization ?? null,
      fields.description ?? null,
      fields.jobUrl ?? null,
      fields.region ?? null,
      fields.roleType ?? null,
    ]
  );
  return result.rows[0];
}

async function update(opportunityId, fields, executor = pool) {
  const result = await executor.query(
    `UPDATE opportunities
     SET title = $2,
         organization = $3,
         description = $4,
         job_url = $5,
         region = $6,
         role_type = $7,
         updated_at = clock_timestamp()
     WHERE opportunity_id = $1
     RETURNING ${OPPORTUNITY_COLUMNS}`,
    [
      opportunityId,
      fields.title,
      fields.organization ?? null,
      fields.description ?? null,
      fields.jobUrl ?? null,
      fields.region ?? null,
      fields.roleType ?? null,
    ]
  );
  return result.rows[0] || null;
}

async function deleteById(opportunityId, executor = pool) {
  const result = await executor.query(
    `DELETE FROM opportunities
     WHERE opportunity_id = $1
     RETURNING opportunity_id`,
    [opportunityId]
  );
  return result.rows[0] || null;
}

async function listSkills(opportunityId, executor = pool) {
  const result = await executor.query(
    `SELECT s.skill_id, s.skill_name, os.importance_level
     FROM opportunity_skills os
     JOIN skills s ON s.skill_id = os.skill_id
     WHERE os.opportunity_id = $1
     ORDER BY s.skill_name ASC, s.skill_id ASC`,
    [opportunityId]
  );
  return result.rows;
}

async function addSkill(opportunityId, skillId, importanceLevel = 3, executor = pool) {
  const result = await executor.query(
    `INSERT INTO opportunity_skills (opportunity_id, skill_id, importance_level)
     VALUES ($1, $2, $3)
     ON CONFLICT (opportunity_id, skill_id) DO NOTHING
     RETURNING opportunity_id, skill_id, importance_level`,
    [opportunityId, skillId, importanceLevel]
  );
  return result.rows[0] || null;
}

async function removeSkill(opportunityId, skillId, executor = pool) {
  const result = await executor.query(
    `DELETE FROM opportunity_skills
     WHERE opportunity_id = $1 AND skill_id = $2
     RETURNING opportunity_id, skill_id`,
    [opportunityId, skillId]
  );
  return result.rows[0] || null;
}

module.exports = {
  list,
  findById,
  create,
  update,
  deleteById,
  listSkills,
  addSkill,
  removeSkill,
};
