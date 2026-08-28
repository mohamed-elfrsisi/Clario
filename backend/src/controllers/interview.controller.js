const service = require('../services/interview.service');

const listInterviews = async (req, res) => res.status(200).json({ interviews: await service.listInterviews(req.user.userId) });
const getInterview = async (req, res) => res.status(200).json({ interview: await service.getInterview(req.user.userId, req.params.interviewId) });
const createInterview = async (req, res) => res.status(201).json({ interview: await service.createInterview(req.user.userId, req.body) });
const updateInterview = async (req, res) => res.status(200).json({ interview: await service.updateInterview(req.user.userId, req.params.interviewId, req.body) });
const deleteInterview = async (req, res) => { await service.deleteInterview(req.user.userId, req.params.interviewId); res.status(204).send(); };

const listQuestions = async (req, res) => res.status(200).json({ interviewQuestions: await service.listQuestions(req.user.userId, req.params.interviewId) });
const getQuestion = async (req, res) => res.status(200).json({ interviewQuestion: await service.getQuestion(req.user.userId, req.params.interviewId, req.params.questionId) });
const createQuestion = async (req, res) => res.status(201).json({ interviewQuestion: await service.createQuestion(req.user.userId, req.params.interviewId, req.body) });
const updateQuestion = async (req, res) => res.status(200).json({ interviewQuestion: await service.updateQuestion(req.user.userId, req.params.interviewId, req.params.questionId, req.body) });
const deleteQuestion = async (req, res) => { await service.deleteQuestion(req.user.userId, req.params.interviewId, req.params.questionId); res.status(204).send(); };

const listAnswers = async (req, res) => res.status(200).json({ interviewAnswers: await service.listAnswers(req.user.userId, req.params.interviewId, req.params.questionId) });
const getAnswer = async (req, res) => res.status(200).json({ interviewAnswer: await service.getAnswer(req.user.userId, req.params.interviewId, req.params.questionId, req.params.answerId) });
const createAnswer = async (req, res) => res.status(201).json({ interviewAnswer: await service.createAnswer(req.user.userId, req.params.interviewId, req.params.questionId, req.body) });
const updateAnswer = async (req, res) => res.status(200).json({ interviewAnswer: await service.updateAnswer(req.user.userId, req.params.interviewId, req.params.questionId, req.params.answerId, req.body) });
const deleteAnswer = async (req, res) => { await service.deleteAnswer(req.user.userId, req.params.interviewId, req.params.questionId, req.params.answerId); res.status(204).send(); };

const getEvaluation = async (req, res) => res.status(200).json({ interviewEvaluation: await service.getEvaluation(req.user.userId, req.params.interviewId, req.params.questionId, req.params.answerId, req.params.evaluationId) });
const createEvaluation = async (req, res) => res.status(201).json({ interviewEvaluation: await service.createEvaluation(req.user.userId, req.params.interviewId, req.params.questionId, req.params.answerId, req.body) });
const updateEvaluation = async (req, res) => res.status(200).json({ interviewEvaluation: await service.updateEvaluation(req.user.userId, req.params.interviewId, req.params.questionId, req.params.answerId, req.params.evaluationId, req.body) });
const deleteEvaluation = async (req, res) => { await service.deleteEvaluation(req.user.userId, req.params.interviewId, req.params.questionId, req.params.answerId, req.params.evaluationId); res.status(204).send(); };

module.exports = {
  listInterviews, getInterview, createInterview, updateInterview, deleteInterview,
  listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion,
  listAnswers, getAnswer, createAnswer, updateAnswer, deleteAnswer,
  getEvaluation, createEvaluation, updateEvaluation, deleteEvaluation,
};
