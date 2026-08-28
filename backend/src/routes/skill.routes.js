// src/routes/skill.routes.js
//
// The shared, non-user-owned skills reference list.

const express = require('express');
const skillController = require('../controllers/skill.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateSkillListQuery } = require('../middleware/validation.middleware');

const router = express.Router();

router.get('/', requireAuth, validateSkillListQuery, skillController.listSkills);

module.exports = router;
