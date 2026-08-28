// src/repositories/analysis.repository.js
//
// Every function accepts an optional `executor` (defaults to the
// shared pool) so callers running inside withTransaction() can pass
// the transaction's dedicated client.

const { pool } = require('../config/database');

async function listForProfile(profileId, { limit, offset }, executor = pool) {
  const query = `
    SELECT analysis_id, profile_id, document_id, opportunity_id, analysis_date,
           match_percentage, parseability_score, summary, created_at
    FROM analyses
    WHERE profile_id = $1
    ORDER BY analysis_date DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await executor.query(query, [profileId, limit, offset]);
  return result.rows;
}

// Returns the row ONLY if it belongs to profileId - the ownership
// check every read/delete/sub-resource access relies on.
async function findOwned(analysisId, profileId, executor = pool) {
  const query = `
    SELECT analysis_id, profile_id, document_id, opportunity_id, analysis_date,
           match_percentage, parseability_score, summary, created_at
    FROM analyses
    WHERE analysis_id = $1 AND profile_id = $2
  `;
  const result = await executor.query(query, [analysisId, profileId]);
  return result.rows[0] || null;
}

// match_percentage, parseability_score and summary are deliberately
// NOT accepted here - they are outputs of an analysis-generation
// engine that does not exist in this backend yet (see
// analysis.service.js). Every analysis is created with those columns
// null, exactly as the schema allows.
async function create(profileId, { documentId, opportunityId }, executor = pool) {
  const query = `
    INSERT INTO analyses (profile_id, document_id, opportunity_id)
    VALUES ($1, $2, $3)
    RETURNING analysis_id, profile_id, document_id, opportunity_id, analysis_date,
              match_percentage, parseability_score, summary, created_at
  `;
  const result = await executor.query(query, [profileId, documentId, opportunityId]);
  return result.rows[0];
}

async function deleteOwned(analysisId, profileId, executor = pool) {
  const query = `
    DELETE FROM analyses
    WHERE analysis_id = $1 AND profile_id = $2
    RETURNING analysis_id
  `;
  const result = await executor.query(query, [analysisId, profileId]);
  return result.rows.length > 0;
}

module.exports = {
  listForProfile,
  findOwned,
  create,
  deleteOwned,
};
