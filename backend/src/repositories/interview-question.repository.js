const { pool } = require('../config/database');

const SELECT = `
  SELECT q.question_id, q.interview_id, q.question_text, q.question_type,
         q.order_index
  FROM interview_questions q
`;

async function listForInterview(interviewId, executor = pool) {
  const result = await executor.query(
    `${SELECT} WHERE q.interview_id = $1 ORDER BY q.order_index ASC, q.question_id ASC`,
    [interviewId]
  );
  return result.rows;
}

async function findOwned(questionId, interviewId, profileId, executor = pool) {
  const result = await executor.query(
    `${SELECT}
     JOIN interviews i ON i.interview_id = q.interview_id
     WHERE q.question_id = $1 AND q.interview_id = $2 AND i.profile_id = $3`,
    [questionId, interviewId, profileId]
  );
  return result.rows[0] || null;
}

async function create(interviewId, fields, executor = pool) {
  const result = await executor.query(
    `INSERT INTO interview_questions (interview_id, question_text, question_type, order_index)
     VALUES ($1,$2,$3,$4)
     RETURNING question_id, interview_id, question_text, question_type, order_index`,
    [interviewId, fields.questionText, fields.questionType, fields.orderIndex]
  );
  return result.rows[0];
}

async function updateOwned(questionId, interviewId, profileId, fields, executor = pool) {
  const result = await executor.query(
    `UPDATE interview_questions q
     SET question_text = $4, question_type = $5, order_index = $6
     FROM interviews i
     WHERE q.question_id = $1 AND q.interview_id = $2
       AND i.interview_id = q.interview_id AND i.profile_id = $3
     RETURNING q.question_id, q.interview_id, q.question_text, q.question_type, q.order_index`,
    [questionId, interviewId, profileId, fields.questionText, fields.questionType, fields.orderIndex]
  );
  return result.rows[0] || null;
}

async function deleteOwned(questionId, interviewId, profileId, executor = pool) {
  const result = await executor.query(
    `DELETE FROM interview_questions q
     USING interviews i
     WHERE q.question_id = $1 AND q.interview_id = $2
       AND i.interview_id = q.interview_id AND i.profile_id = $3
     RETURNING q.question_id`,
    [questionId, interviewId, profileId]
  );
  return result.rows.length > 0;
}

module.exports = { listForInterview, findOwned, create, updateOwned, deleteOwned };
