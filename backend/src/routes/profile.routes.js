// src/routes/profile.routes.js
//
// Routes only map HTTP methods/paths to controllers and middleware.
// Every route requires authentication; ownership itself is enforced
// in the service layer by deriving profile_id from req.user.userId.

const express = require('express');
const profileController = require('../controllers/profile.controller');
const skillController = require('../controllers/skill.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validateProfileFields,
  validateAddSkill,
  validateSkillIdParam,
} = require('../middleware/validation.middleware');

const router = express.Router();

router.use(requireAuth);

router.post('/', validateProfileFields, profileController.createProfile);
router.get('/me', profileController.getMyProfile);
router.put('/me', validateProfileFields, profileController.updateMyProfile);

// Profile-scoped skills. Ownership is derived from req.user.userId in
// the service layer, never from the URL, so these can't be pointed at
// another user's profile.
router.get('/me/skills', skillController.listMySkills);
router.post('/me/skills', validateAddSkill, skillController.addMySkill);
router.delete('/me/skills/:skillId', validateSkillIdParam, skillController.removeMySkill);

module.exports = router;
