const { pool } = require('../config/database');

const SELECT = `
  SELECT a.answer_id, a.question_id, a.answer_text, a.answer_type, a.answered_at
  FROM interview_answers a
`;

async function listForQuestion(questionId, executor = pool) {
  const result = await executor.query(
    `${SELECT} WHERE a.question_id = $1 ORDER BY a.answered_at ASC NULLS LAST, a.answer_id ASC`,
    [questionId]
  );
  return result.rows;
}

async function findOwned(answerId, questionId, interviewId, profileId, executor = pool) {
  const result = await executor.query(
    `${SELECT}
     JOIN interview_questions q ON q.question_id = a.question_id
     JOIN interviews i ON i.interview_id = q.interview_id
     WHERE a.answer_id = $1 AND a.question_id = $2
       AND q.interview_id = $3 AND i.profile_id = $4`,
    [answerId, questionId, interviewId, profileId]
  );
  return result.rows[0] || null;
}

async function create(questionId, fields, executor = pool) {
  const result = await executor.query(
    `INSERT INTO interview_answers (question_id, answer_text, answer_type, answered_at)
     VALUES ($1,$2,$3,$4)
     RETURNING answer_id, question_id, answer_text, answer_type, answered_at`,
    [questionId, fields.answerText ?? null, fields.answerType ?? null, fields.answeredAt ?? null]
  );
  return result.rows[0];
}

async function updateOwned(answerId, questionId, interviewId, profileId, fields, executor = pool) {
  const result = await executor.query(
    `UPDATE interview_answers a
     SET answer_text = $5, answer_type = $6, answered_at = $7
     FROM interview_questions q
     JOIN interviews i ON i.interview_id = q.interview_id
     WHERE a.answer_id = $1 AND a.question_id = $2
       AND q.interview_id = $3 AND i.profile_id = $4
     RETURNING a.answer_id, a.question_id, a.answer_text, a.answer_type, a.answered_at`,
    [answerId, questionId, interviewId, profileId, fields.answerText ?? null, fields.answerType ?? null, fields.answeredAt ?? null]
  );
  return result.rows[0] || null;
}

async function deleteOwned(answerId, questionId, interviewId, profileId, executor = pool) {
  const result = await executor.query(
    `DELETE FROM interview_answers a
     USING interview_questions q, interviews i
     WHERE a.answer_id = $1 AND a.question_id = $2
       AND q.question_id = a.question_id AND q.interview_id = $3
       AND i.interview_id = q.interview_id AND i.profile_id = $4
     RETURNING a.answer_id`,
    [answerId, questionId, interviewId, profileId]
  );
  return result.rows.length > 0;
}

module.exports = { listForQuestion, findOwned, create, updateOwned, deleteOwned };
