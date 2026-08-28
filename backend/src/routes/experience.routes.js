// src/routes/experience.routes.js
//
// All routes require authentication; ownership is enforced in the
// service layer (profile_id is derived from req.user.userId, and every
// experienceId is looked up scoped to that profile_id - never trusted
// from the URL alone).

const express = require('express');
const experienceController = require('../controllers/experience.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validatePaginationQuery,
  validateExperienceIdParam,
  validateCreateExperience,
  validateUpdateExperience,
  validateAddSkill,
  validateSkillIdParam,
} = require('../middleware/validation.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', validatePaginationQuery, experienceController.listExperiences);
router.post('/', validateCreateExperience, experienceController.createExperience);

router.get('/:experienceId', validateExperienceIdParam, experienceController.getExperience);
router.put(
  '/:experienceId',
  validateExperienceIdParam,
  validateUpdateExperience,
  experienceController.updateExperience
);
router.delete('/:experienceId', validateExperienceIdParam, experienceController.deleteExperience);

router.get('/:experienceId/skills', validateExperienceIdParam, experienceController.listExperienceSkills);
router.post(
  '/:experienceId/skills',
  validateExperienceIdParam,
  validateAddSkill,
  experienceController.addExperienceSkill
);
router.delete(
  '/:experienceId/skills/:skillId',
  validateExperienceIdParam,
  validateSkillIdParam,
  experienceController.removeExperienceSkill
);

module.exports = router;
