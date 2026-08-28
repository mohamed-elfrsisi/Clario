const { pool } = require('../config/database');

const INTERVIEW_COLUMNS = `
  i.interview_id, i.profile_id, i.opportunity_id, i.interview_type,
  i.status, i.scheduled_at, i.started_at, i.ended_at,
  i.overall_score, i.feedback, i.created_at, i.updated_at
`;

async function listOwned(profileId, executor = pool) {
  const result = await executor.query(
    `SELECT ${INTERVIEW_COLUMNS}
     FROM interviews i
     WHERE i.profile_id = $1
     ORDER BY i.created_at DESC`,
    [profileId]
  );
  return result.rows;
}

async function findOwned(interviewId, profileId, executor = pool) {
  const result = await executor.query(
    `SELECT ${INTERVIEW_COLUMNS}
     FROM interviews i
     WHERE i.interview_id = $1 AND i.profile_id = $2`,
    [interviewId, profileId]
  );
  return result.rows[0] || null;
}

async function create(profileId, fields, executor = pool) {
  const result = await executor.query(
    `INSERT INTO interviews
       (profile_id, opportunity_id, interview_type, status, scheduled_at,
        started_at, ended_at, overall_score, feedback)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING interview_id, profile_id, opportunity_id, interview_type,
       status, scheduled_at, started_at, ended_at, overall_score, feedback,
       created_at, updated_at`,
    [
      profileId,
      fields.opportunityId ?? null,
      fields.interviewType,
      fields.status ?? 'created',
      fields.scheduledAt ?? null,
      fields.startedAt ?? null,
      fields.endedAt ?? null,
      fields.overallScore ?? null,
      fields.feedback ?? null,
    ]
  );
  return result.rows[0];
}

async function updateOwned(interviewId, profileId, fields, executor = pool) {
  const result = await executor.query(
    `UPDATE interviews
     SET opportunity_id = $3,
         interview_type = $4,
         status = $5,
         scheduled_at = $6,
         started_at = $7,
         ended_at = $8,
         overall_score = $9,
         feedback = $10,
         updated_at = clock_timestamp()
     WHERE interview_id = $1 AND profile_id = $2
     RETURNING interview_id, profile_id, opportunity_id, interview_type,
       status, scheduled_at, started_at, ended_at, overall_score, feedback,
       created_at, updated_at`,
    [
      interviewId,
      profileId,
      fields.opportunityId ?? null,
      fields.interviewType,
      fields.status,
      fields.scheduledAt ?? null,
      fields.startedAt ?? null,
      fields.endedAt ?? null,
      fields.overallScore ?? null,
      fields.feedback ?? null,
    ]
  );
  return result.rows[0] || null;
}

async function deleteOwned(interviewId, profileId, executor = pool) {
  const result = await executor.query(
    `DELETE FROM interviews
     WHERE interview_id = $1 AND profile_id = $2
     RETURNING interview_id`,
    [interviewId, profileId]
  );
  return result.rows.length > 0;
}

async function findOpportunity(opportunityId, executor = pool) {
  const result = await executor.query(
    `SELECT opportunity_id FROM opportunities WHERE opportunity_id = $1`,
    [opportunityId]
  );
  return result.rows[0] || null;
}

module.exports = { listOwned, findOwned, create, updateOwned, deleteOwned, findOpportunity };
