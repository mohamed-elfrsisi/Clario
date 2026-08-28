// src/repositories/career-alignment.repository.js

const { pool } = require('../config/database');

async function listForAnalysis(analysisId, executor = pool) {
  const query = `
    SELECT career_alignment_id, analysis_id, career_target_id, alignment_score,
           matching_factors, missing_factors, created_at
    FROM career_alignments
    WHERE analysis_id = $1
    ORDER BY created_at DESC
  `;
  const result = await executor.query(query, [analysisId]);
  return result.rows;
}

async function findOwned(careerAlignmentId, analysisId, executor = pool) {
  const query = `
    SELECT career_alignment_id, analysis_id, career_target_id, alignment_score,
           matching_factors, missing_factors, created_at
    FROM career_alignments
    WHERE career_alignment_id = $1 AND analysis_id = $2
  `;
  const result = await executor.query(query, [careerAlignmentId, analysisId]);
  return result.rows[0] || null;
}

async function create(
  analysisId,
  { careerTargetId, alignmentScore, matchingFactors, missingFactors },
  executor = pool
) {
  const query = `
    INSERT INTO career_alignments (analysis_id, career_target_id, alignment_score, matching_factors, missing_factors)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING career_alignment_id, analysis_id, career_target_id, alignment_score,
              matching_factors, missing_factors, created_at
  `;
  const result = await executor.query(query, [
    analysisId,
    careerTargetId,
    alignmentScore,
    matchingFactors,
    missingFactors,
  ]);
  return result.rows[0];
}

async function updateOwned(
  careerAlignmentId,
  analysisId,
  { careerTargetId, alignmentScore, matchingFactors, missingFactors },
  executor = pool
) {
  const query = `
    UPDATE career_alignments
    SET career_target_id = $3,
        alignment_score = $4,
        matching_factors = $5,
        missing_factors = $6
    WHERE career_alignment_id = $1 AND analysis_id = $2
    RETURNING career_alignment_id, analysis_id, career_target_id, alignment_score,
              matching_factors, missing_factors, created_at
  `;
  const result = await executor.query(query, [
    careerAlignmentId,
    analysisId,
    careerTargetId,
    alignmentScore,
    matchingFactors,
    missingFactors,
  ]);
  return result.rows[0] || null;
}

async function deleteOwned(careerAlignmentId, analysisId, executor = pool) {
  const query = `
    DELETE FROM career_alignments
    WHERE career_alignment_id = $1 AND analysis_id = $2
    RETURNING career_alignment_id
  `;
  const result = await executor.query(query, [careerAlignmentId, analysisId]);
  return result.rows.length > 0;
}

module.exports = {
  listForAnalysis,
  findOwned,
  create,
  updateOwned,
  deleteOwned,
};
