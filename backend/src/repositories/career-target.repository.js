// src/repositories/career-target.repository.js
//
// Every function accepts an optional `executor` (defaults to the
// shared pool) so callers running inside withTransaction() can pass
// the transaction's dedicated client instead, keeping every statement
// of a multi-table write on the same connection/transaction.

const { pool } = require('../config/database');

async function listForProfile(profileId, { limit, offset }, executor = pool) {
  const query = `
    SELECT career_target_id, profile_id, target_role, target_industry, target_level,
           target_region, timeframe, additional_notes, created_at, updated_at
    FROM career_targets
    WHERE profile_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await executor.query(query, [profileId, limit, offset]);
  return result.rows;
}

// Returns the row ONLY if it belongs to profileId - this is the
// ownership check every read/update/delete relies on. A mismatch
// (wrong profile OR nonexistent row) returns null either way, so the
// service layer can turn both into an identical 404.
async function findOwned(careerTargetId, profileId, executor = pool) {
  const query = `
    SELECT career_target_id, profile_id, target_role, target_industry, target_level,
           target_region, timeframe, additional_notes, created_at, updated_at
    FROM career_targets
    WHERE career_target_id = $1 AND profile_id = $2
  `;

  const result = await executor.query(query, [careerTargetId, profileId]);
  return result.rows[0] || null;
}

async function create(
  profileId,
  { targetRole, targetIndustry, targetLevel, targetRegion, timeframe, additionalNotes },
  executor = pool
) {
  const query = `
    INSERT INTO career_targets (profile_id, target_role, target_industry, target_level,
                                 target_region, timeframe, additional_notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING career_target_id, profile_id, target_role, target_industry, target_level,
              target_region, timeframe, additional_notes, created_at, updated_at
  `;

  const result = await executor.query(query, [
    profileId,
    targetRole,
    targetIndustry ?? null,
    targetLevel ?? null,
    targetRegion ?? null,
    timeframe ?? null,
    additionalNotes ?? null,
  ]);

  return result.rows[0];
}

async function updateOwned(careerTargetId, profileId, fields, executor = pool) {
  const { targetRole, targetIndustry, targetLevel, targetRegion, timeframe, additionalNotes } = fields;

  const query = `
    UPDATE career_targets
    SET target_role = COALESCE($3, target_role),
        target_industry = COALESCE($4, target_industry),
        target_level = COALESCE($5, target_level),
        target_region = COALESCE($6, target_region),
        timeframe = COALESCE($7, timeframe),
        additional_notes = COALESCE($8, additional_notes),
        updated_at = clock_timestamp()
    WHERE career_target_id = $1 AND profile_id = $2
    RETURNING career_target_id, profile_id, target_role, target_industry, target_level,
              target_region, timeframe, additional_notes, created_at, updated_at
  `;

  const result = await executor.query(query, [
    careerTargetId,
    profileId,
    targetRole ?? null,
    targetIndustry ?? null,
    targetLevel ?? null,
    targetRegion ?? null,
    timeframe ?? null,
    additionalNotes ?? null,
  ]);

  return result.rows[0] || null;
}

async function deleteOwned(careerTargetId, profileId, executor = pool) {
  const query = `
    DELETE FROM career_targets
    WHERE career_target_id = $1 AND profile_id = $2
    RETURNING career_target_id
  `;

  const result = await executor.query(query, [careerTargetId, profileId]);
  return result.rows.length > 0;
}

// --- target_skills (junction) --------------------------------------

async function listSkills(careerTargetId, executor = pool) {
  const query = `
    SELECT s.skill_id, s.skill_name, ts.importance_level
    FROM target_skills ts
    JOIN skills s ON s.skill_id = ts.skill_id
    WHERE ts.career_target_id = $1
    ORDER BY s.skill_name ASC
  `;

  const result = await executor.query(query, [careerTargetId]);
  return result.rows;
}

// Upsert: adding a skill that's already attached updates its
// importance_level instead of erroring, so re-adding is idempotent
// and also doubles as "change the importance of this skill". The
// `inserted` flag (via the classic xmax = 0 trick) tells the caller
// whether this was a brand-new attachment (201) or an update to an
// existing one (200) without a second round-trip query.
async function addSkill(careerTargetId, skillId, importanceLevel, executor = pool) {
  const query = `
    INSERT INTO target_skills (career_target_id, skill_id, importance_level)
    VALUES ($1, $2, $3)
    ON CONFLICT (career_target_id, skill_id)
    DO UPDATE SET importance_level = EXCLUDED.importance_level
    RETURNING career_target_id, skill_id, importance_level, (xmax = 0) AS inserted
  `;

  const result = await executor.query(query, [careerTargetId, skillId, importanceLevel]);
  return result.rows[0];
}

async function removeSkill(careerTargetId, skillId, executor = pool) {
  const query = `
    DELETE FROM target_skills
    WHERE career_target_id = $1 AND skill_id = $2
    RETURNING career_target_id, skill_id
  `;

  const result = await executor.query(query, [careerTargetId, skillId]);
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
