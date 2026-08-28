const express = require('express');
const controller = require('../controllers/interview.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const v = require('../middleware/validation.middleware');

const router = express.Router();
router.use(requireAuth);

router.get('/', controller.listInterviews);
router.post('/', v.validateCreateInterview, controller.createInterview);
router.get('/:interviewId', v.validateInterviewIdParam, controller.getInterview);
router.put('/:interviewId', v.validateInterviewIdParam, v.validateUpdateInterview, controller.updateInterview);
router.delete('/:interviewId', v.validateInterviewIdParam, controller.deleteInterview);

router.get('/:interviewId/questions', v.validateInterviewIdParam, controller.listQuestions);
router.post('/:interviewId/questions', v.validateInterviewIdParam, v.validateCreateInterviewQuestion, controller.createQuestion);
router.get('/:interviewId/questions/:questionId', v.validateInterviewQuestionParams, controller.getQuestion);
router.put('/:interviewId/questions/:questionId', v.validateInterviewQuestionParams, v.validateUpdateInterviewQuestion, controller.updateQuestion);
router.delete('/:interviewId/questions/:questionId', v.validateInterviewQuestionParams, controller.deleteQuestion);

router.get('/:interviewId/questions/:questionId/answers', v.validateInterviewQuestionParams, controller.listAnswers);
router.post('/:interviewId/questions/:questionId/answers', v.validateInterviewQuestionParams, v.validateCreateInterviewAnswer, controller.createAnswer);
router.get('/:interviewId/questions/:questionId/answers/:answerId', v.validateInterviewAnswerParams, controller.getAnswer);
router.put('/:interviewId/questions/:questionId/answers/:answerId', v.validateInterviewAnswerParams, v.validateUpdateInterviewAnswer, controller.updateAnswer);
router.delete('/:interviewId/questions/:questionId/answers/:answerId', v.validateInterviewAnswerParams, controller.deleteAnswer);

router.get('/:interviewId/questions/:questionId/answers/:answerId/evaluations/:evaluationId', v.validateInterviewEvaluationParams, controller.getEvaluation);
router.post('/:interviewId/questions/:questionId/answers/:answerId/evaluations', v.validateInterviewAnswerParams, v.validateCreateInterviewEvaluation, controller.createEvaluation);
router.put('/:interviewId/questions/:questionId/answers/:answerId/evaluations/:evaluationId', v.validateInterviewEvaluationParams, v.validateUpdateInterviewEvaluation, controller.updateEvaluation);
router.delete('/:interviewId/questions/:questionId/answers/:answerId/evaluations/:evaluationId', v.validateInterviewEvaluationParams, controller.deleteEvaluation);

module.exports = router;
