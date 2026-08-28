// src/routes/project.routes.js
//
// All routes require authentication; ownership is enforced in the
// service layer (profile_id is derived from req.user.userId, and every
// projectId is looked up scoped to that profile_id - never trusted
// from the URL alone).

const express = require('express');
const projectController = require('../controllers/project.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validatePaginationQuery,
  validateProjectIdParam,
  validateCreateProject,
  validateUpdateProject,
  validateAddSkill,
  validateSkillIdParam,
} = require('../middleware/validation.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', validatePaginationQuery, projectController.listProjects);
router.post('/', validateCreateProject, projectController.createProject);

router.get('/:projectId', validateProjectIdParam, projectController.getProject);
router.put(
  '/:projectId',
  validateProjectIdParam,
  validateUpdateProject,
  projectController.updateProject
);
router.delete('/:projectId', validateProjectIdParam, projectController.deleteProject);

router.get('/:projectId/skills', validateProjectIdParam, projectController.listProjectSkills);
router.post(
  '/:projectId/skills',
  validateProjectIdParam,
  validateAddSkill,
  projectController.addProjectSkill
);
router.delete(
  '/:projectId/skills/:skillId',
  validateProjectIdParam,
  validateSkillIdParam,
  projectController.removeProjectSkill
);

module.exports = router;
