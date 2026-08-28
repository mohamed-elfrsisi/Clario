// src/routes/education.routes.js
//
// All routes require authentication; ownership is enforced in the
// service layer via profile_id derived from req.user.userId.

const express = require('express');
const educationController = require('../controllers/education.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validatePaginationQuery,
  validateEducationIdParam,
  validateCreateEducation,
  validateUpdateEducation,
} = require('../middleware/validation.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', validatePaginationQuery, educationController.listEducations);
router.post('/', validateCreateEducation, educationController.createEducation);

router.get('/:educationId', validateEducationIdParam, educationController.getEducation);
router.put(
  '/:educationId',
  validateEducationIdParam,
  validateUpdateEducation,
  educationController.updateEducation
);
router.delete('/:educationId', validateEducationIdParam, educationController.deleteEducation);

module.exports = router;
