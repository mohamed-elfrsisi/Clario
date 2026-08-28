const interviewRepository = require('../repositories/interview.repository');
const interviewQuestionRepository = require('../repositories/interview-question.repository');
const interviewAnswerRepository = require('../repositories/interview-answer.repository');
const interviewEvaluationRepository = require('../repositories/interview-evaluation.repository');
const profileService = require('./profile.service');
const AppError = require('../errors/app-error');

function publicInterview(row) {
  return {
    interviewId: row.interview_id,
    profileId: row.profile_id,
    opportunityId: row.opportunity_id,
    interviewType: row.interview_type,
    status: row.status,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    overallScore: row.overall_score === null ? null : Number(row.overall_score),
    feedback: row.feedback,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function publicQuestion(row) {
  return {
    questionId: row.question_id,
    interviewId: row.interview_id,
    questionText: row.question_text,
    questionType: row.question_type,
    orderIndex: row.order_index,
  };
}

function publicAnswer(row) {
  return {
    answerId: row.answer_id,
    questionId: row.question_id,
    answerText: row.answer_text,
    answerType: row.answer_type,
    answeredAt: row.answered_at,
  };
}

function publicEvaluation(row) {
  return {
    evaluationId: row.evaluation_id,
    answerId: row.answer_id,
    score: Number(row.score),
    feedback: row.feedback,
    evaluatedAt: row.evaluated_at,
  };
}

function rethrowDbConstraint(err) {
  if (err?.code === '23503') {
    throw new AppError(404, 'PARENT_NOT_FOUND', 'Referenced resource not found');
  }
  if (err?.code === '23505') {
    throw new AppError(409, 'CONFLICT', 'Resource conflicts with existing data');
  }
  if (err?.code === '23514') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Input violates a database constraint');
  }
  throw err;
}

async function requireOwnedInterview(userId, interviewId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const interview = await interviewRepository.findOwned(interviewId, profileId);
  if (!interview) {
    throw new AppError(404, 'INTERVIEW_NOT_FOUND', 'Interview not found');
  }
  return { profileId, interview };
}

async function validateOpportunity(opportunityId) {
  if (opportunityId === undefined || opportunityId === null) return;
  const opportunity = await interviewRepository.findOpportunity(opportunityId);
  if (!opportunity) {
    throw new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found');
  }
}

async function listInterviews(userId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const rows = await interviewRepository.listOwned(profileId);
  return rows.map(publicInterview);
}

async function getInterview(userId, interviewId) {
  const { interview } = await requireOwnedInterview(userId, interviewId);
  return publicInterview(interview);
}

async function createInterview(userId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  await validateOpportunity(fields.opportunityId);
  try {
    return publicInterview(await interviewRepository.create(profileId, fields));
  } catch (err) {
    rethrowDbConstraint(err);
  }
}

async function updateInterview(userId, interviewId, fields) {
  const { profileId } = await requireOwnedInterview(userId, interviewId);
  await validateOpportunity(fields.opportunityId);
  try {
    const existing = await interviewRepository.findOwned(interviewId, profileId);
    if (!existing) throw new AppError(404, 'INTERVIEW_NOT_FOUND', 'Interview not found');
    const merged = {
      opportunityId: fields.opportunityId === undefined ? existing.opportunity_id : fields.opportunityId,
      interviewType: fields.interviewType === undefined ? existing.interview_type : fields.interviewType,
      status: fields.status === undefined ? existing.status : fields.status,
      scheduledAt: fields.scheduledAt === undefined ? existing.scheduled_at : fields.scheduledAt,
      startedAt: fields.startedAt === undefined ? existing.started_at : fields.startedAt,
      endedAt: fields.endedAt === undefined ? existing.ended_at : fields.endedAt,
      overallScore: fields.overallScore === undefined ? (existing.overall_score === null ? null : Number(existing.overall_score)) : fields.overallScore,
      feedback: fields.feedback === undefined ? existing.feedback : fields.feedback,
    };
    await validateOpportunity(merged.opportunityId);
    const updated = await interviewRepository.updateOwned(interviewId, profileId, merged);
    if (!updated) throw new AppError(404, 'INTERVIEW_NOT_FOUND', 'Interview not found');
    return publicInterview(updated);
  } catch (err) {
    if (err instanceof AppError) throw err;
    rethrowDbConstraint(err);
  }
}

async function deleteInterview(userId, interviewId) {
  const { profileId } = await requireOwnedInterview(userId, interviewId);
  try {
    const deleted = await interviewRepository.deleteOwned(interviewId, profileId);
    if (!deleted) throw new AppError(404, 'INTERVIEW_NOT_FOUND', 'Interview not found');
  } catch (err) {
    if (err instanceof AppError) throw err;
    rethrowDbConstraint(err);
  }
}

async function listQuestions(userId, interviewId) {
  const { interview } = await requireOwnedInterview(userId, interviewId);
  const rows = await interviewQuestionRepository.listForInterview(interview.interview_id);
  return rows.map(publicQuestion);
}

async function getQuestion(userId, interviewId, questionId) {
  const { profileId } = await requireOwnedInterview(userId, interviewId);
  const row = await interviewQuestionRepository.findOwned(questionId, interviewId, profileId);
  if (!row) throw new AppError(404, 'INTERVIEW_QUESTION_NOT_FOUND', 'Interview question not found');
  return publicQuestion(row);
}

async function createQuestion(userId, interviewId, fields) {
  const { interview } = await requireOwnedInterview(userId, interviewId);
  try {
    return publicQuestion(await interviewQuestionRepository.create(interview.interview_id, fields));
  } catch (err) {
    rethrowDbConstraint(err);
  }
}

async function updateQuestion(userId, interviewId, questionId, fields) {
  const { profileId } = await requireOwnedInterview(userId, interviewId);
  try {
    const existing = await interviewQuestionRepository.findOwned(questionId, interviewId, profileId);
    if (!existing) throw new AppError(404, 'INTERVIEW_QUESTION_NOT_FOUND', 'Interview question not found');
    const merged = {
      questionText: fields.questionText === undefined ? existing.question_text : fields.questionText,
      questionType: fields.questionType === undefined ? existing.question_type : fields.questionType,
      orderIndex: fields.orderIndex === undefined ? existing.order_index : fields.orderIndex,
    };
    const updated = await interviewQuestionRepository.updateOwned(questionId, interviewId, profileId, merged);
    return publicQuestion(updated);
  } catch (err) {
    if (err instanceof AppError) throw err;
    rethrowDbConstraint(err);
  }
}

async function deleteQuestion(userId, interviewId, questionId) {
  const { profileId } = await requireOwnedInterview(userId, interviewId);
  try {
    const deleted = await interviewQuestionRepository.deleteOwned(questionId, interviewId, profileId);
    if (!deleted) throw new AppError(404, 'INTERVIEW_QUESTION_NOT_FOUND', 'Interview question not found');
  } catch (err) {
    if (err instanceof AppError) throw err;
    rethrowDbConstraint(err);
  }
}

async function requireOwnedQuestion(userId, interviewId, questionId) {
  const { profileId } = await requireOwnedInterview(userId, interviewId);
  const question = await interviewQuestionRepository.findOwned(questionId, interviewId, profileId);
  if (!question) throw new AppError(404, 'INTERVIEW_QUESTION_NOT_FOUND', 'Interview question not found');
  return { profileId, question };
}

async function listAnswers(userId, interviewId, questionId) {
  const { question } = await requireOwnedQuestion(userId, interviewId, questionId);
  const rows = await interviewAnswerRepository.listForQuestion(question.question_id);
  return rows.map(publicAnswer);
}

async function getAnswer(userId, interviewId, questionId, answerId) {
  const { profileId } = await requireOwnedQuestion(userId, interviewId, questionId);
  const row = await interviewAnswerRepository.findOwned(answerId, questionId, interviewId, profileId);
  if (!row) throw new AppError(404, 'INTERVIEW_ANSWER_NOT_FOUND', 'Interview answer not found');
  return publicAnswer(row);
}

async function createAnswer(userId, interviewId, questionId, fields) {
  const { question } = await requireOwnedQuestion(userId, interviewId, questionId);
  try {
    return publicAnswer(await interviewAnswerRepository.create(question.question_id, fields));
  } catch (err) {
    rethrowDbConstraint(err);
  }
}

async function updateAnswer(userId, interviewId, questionId, answerId, fields) {
  const { profileId } = await requireOwnedQuestion(userId, interviewId, questionId);
  try {
    const existing = await interviewAnswerRepository.findOwned(answerId, questionId, interviewId, profileId);
    if (!existing) throw new AppError(404, 'INTERVIEW_ANSWER_NOT_FOUND', 'Interview answer not found');
    const merged = {
      answerText: fields.answerText === undefined ? existing.answer_text : fields.answerText,
      answerType: fields.answerType === undefined ? existing.answer_type : fields.answerType,
      answeredAt: fields.answeredAt === undefined ? existing.answered_at : fields.answeredAt,
    };
    const updated = await interviewAnswerRepository.updateOwned(answerId, questionId, interviewId, profileId, merged);
    return publicAnswer(updated);
  } catch (err) {
    if (err instanceof AppError) throw err;
    rethrowDbConstraint(err);
  }
}

async function deleteAnswer(userId, interviewId, questionId, answerId) {
  const { profileId } = await requireOwnedQuestion(userId, interviewId, questionId);
  try {
    const deleted = await interviewAnswerRepository.deleteOwned(answerId, questionId, interviewId, profileId);
    if (!deleted) throw new AppError(404, 'INTERVIEW_ANSWER_NOT_FOUND', 'Interview answer not found');
  } catch (err) {
    if (err instanceof AppError) throw err;
    rethrowDbConstraint(err);
  }
}

async function requireOwnedAnswer(userId, interviewId, questionId, answerId) {
  const { profileId } = await requireOwnedQuestion(userId, interviewId, questionId);
  const answer = await interviewAnswerRepository.findOwned(answerId, questionId, interviewId, profileId);
  if (!answer) throw new AppError(404, 'INTERVIEW_ANSWER_NOT_FOUND', 'Interview answer not found');
  return { profileId, answer };
}

async function getEvaluation(userId, interviewId, questionId, answerId, evaluationId) {
  const { profileId } = await requireOwnedAnswer(userId, interviewId, questionId, answerId);
  const row = await interviewEvaluationRepository.findOwned(
    evaluationId, answerId, questionId, interviewId, profileId
  );
  if (!row) throw new AppError(404, 'INTERVIEW_EVALUATION_NOT_FOUND', 'Interview evaluation not found');
  return publicEvaluation(row);
}

async function createEvaluation(userId, interviewId, questionId, answerId, fields) {
  const { answer } = await requireOwnedAnswer(userId, interviewId, questionId, answerId);
  try {
    return publicEvaluation(await interviewEvaluationRepository.create(answer.answer_id, fields));
  } catch (err) {
    rethrowDbConstraint(err);
  }
}

async function updateEvaluation(userId, interviewId, questionId, answerId, evaluationId, fields) {
  const { profileId } = await requireOwnedAnswer(userId, interviewId, questionId, answerId);
  try {
    const existing = await interviewEvaluationRepository.findOwned(
      evaluationId, answerId, questionId, interviewId, profileId
    );
    if (!existing) throw new AppError(404, 'INTERVIEW_EVALUATION_NOT_FOUND', 'Interview evaluation not found');
    const merged = {
      score: fields.score === undefined ? Number(existing.score) : fields.score,
      feedback: fields.feedback === undefined ? existing.feedback : fields.feedback,
      evaluatedAt: fields.evaluatedAt === undefined ? existing.evaluated_at : fields.evaluatedAt,
    };
    const updated = await interviewEvaluationRepository.updateOwned(
      evaluationId, answerId, questionId, interviewId, profileId, merged
    );
    return publicEvaluation(updated);
  } catch (err) {
    if (err instanceof AppError) throw err;
    rethrowDbConstraint(err);
  }
}

async function deleteEvaluation(userId, interviewId, questionId, answerId, evaluationId) {
  const { profileId } = await requireOwnedAnswer(userId, interviewId, questionId, answerId);
  try {
    const deleted = await interviewEvaluationRepository.deleteOwned(
      evaluationId, answerId, questionId, interviewId, profileId
    );
    if (!deleted) throw new AppError(404, 'INTERVIEW_EVALUATION_NOT_FOUND', 'Interview evaluation not found');
  } catch (err) {
    if (err instanceof AppError) throw err;
    rethrowDbConstraint(err);
  }
}

module.exports = {
  listInterviews, getInterview, createInterview, updateInterview, deleteInterview,
  listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion,
  listAnswers, getAnswer, createAnswer, updateAnswer, deleteAnswer,
  getEvaluation, createEvaluation, updateEvaluation, deleteEvaluation,
};
