// src/routes/career-target.routes.js
//
// All routes require authentication; ownership is enforced in the
// service layer (profile_id is derived from req.user.userId, and every
// careerTargetId is looked up scoped to that profile_id - never trusted
// from the URL alone).

const express = require('express');
const careerTargetController = require('../controllers/career-target.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validatePaginationQuery,
  validateCareerTargetIdParam,
  validateCreateCareerTarget,
  validateUpdateCareerTarget,
  validateAddTargetSkill,
  validateSkillIdParam,
} = require('../middleware/validation.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', validatePaginationQuery, careerTargetController.listCareerTargets);
router.post('/', validateCreateCareerTarget, careerTargetController.createCareerTarget);

router.get('/:careerTargetId', validateCareerTargetIdParam, careerTargetController.getCareerTarget);
router.put(
  '/:careerTargetId',
  validateCareerTargetIdParam,
  validateUpdateCareerTarget,
  careerTargetController.updateCareerTarget
);
router.delete(
  '/:careerTargetId',
  validateCareerTargetIdParam,
  careerTargetController.deleteCareerTarget
);

router.get(
  '/:careerTargetId/skills',
  validateCareerTargetIdParam,
  careerTargetController.listTargetSkills
);
router.post(
  '/:careerTargetId/skills',
  validateCareerTargetIdParam,
  validateAddTargetSkill,
  careerTargetController.addTargetSkill
);
router.delete(
  '/:careerTargetId/skills/:skillId',
  validateCareerTargetIdParam,
  validateSkillIdParam,
  careerTargetController.removeTargetSkill
);

module.exports = router;
