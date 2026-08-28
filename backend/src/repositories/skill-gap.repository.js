// src/repositories/skill-gap.repository.js

const { pool } = require('../config/database');

async function listForAnalysis(analysisId, executor = pool) {
  const query = `
    SELECT sg.skill_gap_id, sg.analysis_id, sg.skill_id, sg.current_level,
           sg.required_level, sg.gap_level, sg.priority_level, sg.notes,
           s.skill_name
    FROM skill_gaps sg
    JOIN skills s ON s.skill_id = sg.skill_id
    WHERE sg.analysis_id = $1
    ORDER BY sg.priority_level DESC, s.skill_name ASC
  `;
  const result = await executor.query(query, [analysisId]);
  return result.rows;
}

// Returns the row ONLY if it belongs to analysisId - the ownership
// check every read/update/delete relies on (analysisId itself is
// already verified to belong to the caller's profile one layer up, in
// skill-gap.service.js via analysisService.requireOwnedAnalysis).
async function findOwned(skillGapId, analysisId, executor = pool) {
  const query = `
    SELECT sg.skill_gap_id, sg.analysis_id, sg.skill_id, sg.current_level,
           sg.required_level, sg.gap_level, sg.priority_level, sg.notes,
           s.skill_name
    FROM skill_gaps sg
    JOIN skills s ON s.skill_id = sg.skill_id
    WHERE sg.skill_gap_id = $1 AND sg.analysis_id = $2
  `;
  const result = await executor.query(query, [skillGapId, analysisId]);
  return result.rows[0] || null;
}

// No unique constraint exists on (analysis_id, skill_id) in the
// approved schema (skill_gap_id is the only primary key) - this
// lookup exists purely so the service layer can decide "create a new
// row" vs "update the existing one for this skill" without inventing
// a database-level uniqueness rule that isn't actually there.
async function findByAnalysisAndSkill(analysisId, skillId, executor = pool) {
  const query = `
    SELECT skill_gap_id, analysis_id, skill_id, current_level, required_level,
           gap_level, priority_level, notes
    FROM skill_gaps
    WHERE analysis_id = $1 AND skill_id = $2
  `;
  const result = await executor.query(query, [analysisId, skillId]);
  return result.rows[0] || null;
}

async function create(
  analysisId,
  { skillId, currentLevel, requiredLevel, priorityLevel, notes },
  executor = pool
) {
  const query = `
    INSERT INTO skill_gaps (analysis_id, skill_id, current_level, required_level, priority_level, notes)
    VALUES ($1, $2, COALESCE($3, 0), COALESCE($4, 0), COALESCE($5, 3), $6)
    RETURNING skill_gap_id, analysis_id, skill_id, current_level, required_level,
              gap_level, priority_level, notes
  `;
  const result = await executor.query(query, [
    analysisId,
    skillId,
    currentLevel ?? null,
    requiredLevel ?? null,
    priorityLevel ?? null,
    notes ?? null,
  ]);
  return result.rows[0];
}

async function updateOwned(
  skillGapId,
  analysisId,
  { currentLevel, requiredLevel, priorityLevel, notes },
  executor = pool
) {
  const query = `
    UPDATE skill_gaps
    SET current_level = COALESCE($3, current_level),
        required_level = COALESCE($4, required_level),
        priority_level = COALESCE($5, priority_level),
        notes = COALESCE($6, notes)
    WHERE skill_gap_id = $1 AND analysis_id = $2
    RETURNING skill_gap_id, analysis_id, skill_id, current_level, required_level,
              gap_level, priority_level, notes
  `;
  const result = await executor.query(query, [
    skillGapId,
    analysisId,
    currentLevel ?? null,
    requiredLevel ?? null,
    priorityLevel ?? null,
    notes ?? null,
  ]);
  return result.rows[0] || null;
}

async function deleteOwned(skillGapId, analysisId, executor = pool) {
  const query = `
    DELETE FROM skill_gaps
    WHERE skill_gap_id = $1 AND analysis_id = $2
    RETURNING skill_gap_id
  `;
  const result = await executor.query(query, [skillGapId, analysisId]);
  return result.rows.length > 0;
}

module.exports = {
  listForAnalysis,
  findOwned,
  findByAnalysisAndSkill,
  create,
  updateOwned,
  deleteOwned,
};
