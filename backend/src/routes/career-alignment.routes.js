// src/routes/career-alignment.routes.js
//
// Mounted at /api/analyses/:analysisId/career-alignments.

const express = require('express');
const careerAlignmentController = require('../controllers/career-alignment.controller');
const {
  validateAnalysisIdParam,
  validateCareerAlignmentIdParam,
  validateCreateCareerAlignment,
  validateUpdateCareerAlignment,
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
router.put(
  '/:careerAlignmentId',
  validateCareerAlignmentIdParam,
  validateUpdateCareerAlignment,
  careerAlignmentController.updateCareerAlignment
);
router.delete(
  '/:careerAlignmentId',
  validateCareerAlignmentIdParam,
  careerAlignmentController.deleteCareerAlignment
);

module.exports = router;
