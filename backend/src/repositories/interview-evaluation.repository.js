const { pool } = require('../config/database');

const SELECT = `
  SELECT e.evaluation_id, e.answer_id, e.score, e.feedback, e.evaluated_at
  FROM interview_evaluations e
`;

async function findOwned(evaluationId, answerId, questionId, interviewId, profileId, executor = pool) {
  const result = await executor.query(
    `${SELECT}
     JOIN interview_answers a ON a.answer_id = e.answer_id
     JOIN interview_questions q ON q.question_id = a.question_id
     JOIN interviews i ON i.interview_id = q.interview_id
     WHERE e.evaluation_id = $1 AND e.answer_id = $2
       AND q.question_id = $3 AND q.interview_id = $4 AND i.profile_id = $5`,
    [evaluationId, answerId, questionId, interviewId, profileId]
  );
  return result.rows[0] || null;
}

async function findForAnswer(answerId, questionId, interviewId, profileId, executor = pool) {
  const result = await executor.query(
    `${SELECT}
     JOIN interview_answers a ON a.answer_id = e.answer_id
     JOIN interview_questions q ON q.question_id = a.question_id
     JOIN interviews i ON i.interview_id = q.interview_id
     WHERE e.answer_id = $1 AND q.question_id = $2
       AND q.interview_id = $3 AND i.profile_id = $4`,
    [answerId, questionId, interviewId, profileId]
  );
  return result.rows[0] || null;
}

async function create(answerId, fields, executor = pool) {
  const result = await executor.query(
    `INSERT INTO interview_evaluations (answer_id, score, feedback, evaluated_at)
     VALUES ($1,$2,$3,COALESCE($4, clock_timestamp()))
     RETURNING evaluation_id, answer_id, score, feedback, evaluated_at`,
    [answerId, fields.score, fields.feedback ?? null, fields.evaluatedAt ?? null]
  );
  return result.rows[0];
}

async function updateOwned(evaluationId, answerId, questionId, interviewId, profileId, fields, executor = pool) {
  const result = await executor.query(
    `UPDATE interview_evaluations e
     SET score = $6, feedback = $7, evaluated_at = $8
     FROM interview_answers a
     JOIN interview_questions q ON q.question_id = a.question_id
     JOIN interviews i ON i.interview_id = q.interview_id
     WHERE e.evaluation_id = $1 AND e.answer_id = $2
       AND a.answer_id = e.answer_id AND q.question_id = $3
       AND q.interview_id = $4 AND i.profile_id = $5
     RETURNING e.evaluation_id, e.answer_id, e.score, e.feedback, e.evaluated_at`,
    [evaluationId, answerId, questionId, interviewId, profileId, fields.score, fields.feedback ?? null, fields.evaluatedAt]
  );
  return result.rows[0] || null;
}

async function deleteOwned(evaluationId, answerId, questionId, interviewId, profileId, executor = pool) {
  const result = await executor.query(
    `DELETE FROM interview_evaluations e
     USING interview_answers a, interview_questions q, interviews i
     WHERE e.evaluation_id = $1 AND e.answer_id = $2
       AND a.answer_id = e.answer_id AND a.question_id = q.question_id
       AND q.question_id = $3 AND q.interview_id = $4
       AND i.interview_id = q.interview_id AND i.profile_id = $5
     RETURNING e.evaluation_id`,
    [evaluationId, answerId, questionId, interviewId, profileId]
  );
  return result.rows.length > 0;
}

module.exports = { findOwned, findForAnswer, create, updateOwned, deleteOwned };
