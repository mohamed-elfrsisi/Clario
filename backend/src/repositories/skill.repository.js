// src/repositories/skill.repository.js
//
// Data access for the shared `skills` reference table and the
// `profile_skills` junction table. Parameterized SQL only.

const { pool } = require('../config/database');

// --- skills (shared reference data) ----------------------------------

async function list({ search, limit, offset }) {
  const params = [];
  let where = '';

  if (search) {
    params.push(`%${search}%`);
    where = `WHERE skill_name ILIKE $${params.length}`;
  }

  params.push(limit);
  const limitIndex = params.length;
  params.push(offset);
  const offsetIndex = params.length;

  const query = `
    SELECT skill_id, skill_name, created_at
    FROM skills
    ${where}
    ORDER BY skill_name ASC
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

async function findByName(skillName, executor = pool) {
  const query = `SELECT skill_id, skill_name FROM skills WHERE skill_name = $1`;
  const result = await executor.query(query, [skillName]);
  return result.rows[0] || null;
}

async function findById(skillId) {
  const query = `SELECT skill_id, skill_name FROM skills WHERE skill_id = $1`;
  const result = await pool.query(query, [skillId]);
  return result.rows[0] || null;
}

// Idempotent create: if two requests race to create the same skill
// name, ON CONFLICT DO NOTHING avoids a unique-violation error and the
// follow-up SELECT still returns the row either request wanted.
// Accepts an optional transaction client so callers creating an
// experience/project/etc. together with its skills can keep every
// statement on the same connection/transaction.
async function findOrCreateByName(skillName, executor = pool) {
  const insertQuery = `
    INSERT INTO skills (skill_name)
    VALUES ($1)
    ON CONFLICT (skill_name) DO NOTHING
    RETURNING skill_id, skill_name
  `;

  const inserted = await executor.query(insertQuery, [skillName]);
  if (inserted.rows[0]) {
    return inserted.rows[0];
  }

  return findByName(skillName, executor);
}

// --- profile_skills (junction) ----------------------------------------

async function listForProfile(profileId) {
  const query = `
    SELECT s.skill_id, s.skill_name
    FROM profile_skills ps
    JOIN skills s ON s.skill_id = ps.skill_id
    WHERE ps.profile_id = $1
    ORDER BY s.skill_name ASC
  `;

  const result = await pool.query(query, [profileId]);
  return result.rows;
}

async function addToProfile(profileId, skillId) {
  const query = `
    INSERT INTO profile_skills (profile_id, skill_id)
    VALUES ($1, $2)
    ON CONFLICT (profile_id, skill_id) DO NOTHING
    RETURNING profile_id, skill_id
  `;

  const result = await pool.query(query, [profileId, skillId]);
  return result.rows[0] || null; // null means the relationship already existed
}

async function removeFromProfile(profileId, skillId) {
  const query = `
    DELETE FROM profile_skills
    WHERE profile_id = $1 AND skill_id = $2
    RETURNING profile_id, skill_id
  `;

  const result = await pool.query(query, [profileId, skillId]);
  return result.rows[0] || null;
}

module.exports = {
  list,
  findByName,
  findById,
  findOrCreateByName,
  listForProfile,
  addToProfile,
  removeFromProfile,
};
