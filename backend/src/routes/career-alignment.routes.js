// src/routes/career-alignment.routes.js
//
// Mounted at /api/analyses/:analysisId/career-alignments. No update
// route: every field on a career_alignment is server-computed from
// target_skills/opportunity_skills (see career-alignment.service.js) -
// there is nothing for a client to legitimately PUT. Recomputing means
// deleting and creating a new one.

const express = require('express');
const careerAlignmentController = require('../controllers/career-alignment.controller');
const {
  validateAnalysisIdParam,
  validateCareerAlignmentIdParam,
  validateCreateCareerAlignment,
} = require('../middleware/validation.middleware');

const router = express.Router({ mergeParams: true });

router.use(validateAnalysisIdParam);

router.get('/', careerAlignmentController.listCareerAlignments);
router.post('/', validateCreateCareerAlignment, careerAlignmentController.createCareerAlignment);

router.get(
  '/:careerAlignmentId',
  validateCareerAlignmentIdParam,
  careerAlignmentController.getCareerAlignment
);
router.delete(
  '/:careerAlignmentId',
  validateCareerAlignmentIdParam,
  careerAlignmentController.deleteCareerAlignment
);

module.exports = router;
