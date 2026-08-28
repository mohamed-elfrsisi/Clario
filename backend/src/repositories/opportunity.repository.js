// src/repositories/opportunity.repository.js
//
// SCOPE NOTE: there is no opportunities domain/API in this backend yet
// (no controller/service/routes) - opportunities are shared reference
// data with no owner column, populated by a future admin/ingestion
// phase that doesn't exist yet. This file exists ONLY to let the
// analyses/career-alignments domains validate the opportunity_id
// foreign key and read an opportunity's required skills - it is
// intentionally not a full repository and is not wired to any route.

const { pool } = require('../config/database');

async function findById(opportunityId, executor = pool) {
  const query = `
    SELECT opportunity_id, title, organization, region, role_type
    FROM opportunities
    WHERE opportunity_id = $1
  `;
  const result = await executor.query(query, [opportunityId]);
  return result.rows[0] || null;
}

async function listSkills(opportunityId, executor = pool) {
  const query = `
    SELECT s.skill_id, s.skill_name, os.importance_level
    FROM opportunity_skills os
    JOIN skills s ON s.skill_id = os.skill_id
    WHERE os.opportunity_id = $1
    ORDER BY s.skill_name ASC
  `;
  const result = await executor.query(query, [opportunityId]);
  return result.rows;
}

module.exports = {
  findById,
  listSkills,
};
