// tests/helpers/analysisFixtures.js
//
// Shared setup for the analyses / skill-gaps / career-alignments test
// suites. Opportunities have no API in this backend yet (see
// src/repositories/opportunity.repository.js) so test opportunities
// and their required skills are inserted directly via the pool - the
// only way to get a valid opportunity_id to test against.

const { pool } = require("../../src/config/database");

const QA_PREFIX = "QA Analysis";

function uniqueName(label) {
  return `${QA_PREFIX} ${label} ${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function createTestOpportunity(overrides = {}) {
  const result = await pool.query(
    `INSERT INTO opportunities (title, organization, region, role_type)
     VALUES ($1, $2, $3, $4)
     RETURNING opportunity_id`,
    [
      overrides.title || uniqueName("Opportunity"),
      overrides.organization || "QA Test Org",
      overrides.region || "Remote",
      overrides.roleType || "Full-time",
    ]
  );
  return result.rows[0].opportunity_id;
}

async function createTestSkill() {
  const name = uniqueName("Skill");
  const result = await pool.query(
    `INSERT INTO skills (skill_name) VALUES ($1) RETURNING skill_id, skill_name`,
    [name]
  );
  return result.rows[0];
}

async function attachOpportunitySkill(opportunityId, skillId, importanceLevel = 3) {
  await pool.query(
    `INSERT INTO opportunity_skills (opportunity_id, skill_id, importance_level)
     VALUES ($1, $2, $3)`,
    [opportunityId, skillId, importanceLevel]
  );
}

async function cleanupAnalysisFixtures() {
  await pool.query(
    `DELETE FROM opportunity_skills WHERE skill_id IN (SELECT skill_id FROM skills WHERE skill_name LIKE '${QA_PREFIX}%')`
  );
  await pool.query(
    `DELETE FROM opportunities WHERE title LIKE '${QA_PREFIX}%'`
  );
  await pool.query(
    `DELETE FROM skills WHERE skill_name LIKE '${QA_PREFIX}%'`
  );
}

module.exports = {
  createTestOpportunity,
  createTestSkill,
  attachOpportunitySkill,
  cleanupAnalysisFixtures,
};
