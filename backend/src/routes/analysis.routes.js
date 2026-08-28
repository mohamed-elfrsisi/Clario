// src/routes/analysis.routes.js
//
// No PUT /:analysisId: match_percentage/parseability_score/summary are
// outputs of an analysis-generation engine that doesn't exist in this
// backend yet (see analysis.service.js) - there is nothing on this
// resource a client can legitimately update today.

const express = require('express');
const analysisController = require('../controllers/analysis.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validatePaginationQuery,
  validateAnalysisIdParam,
  validateCreateAnalysis,
} = require('../middleware/validation.middleware');
const skillGapRoutes = require('./skill-gap.routes');
const careerAlignmentRoutes = require('./career-alignment.routes');

const router = express.Router();

router.use(requireAuth);

router.get('/', validatePaginationQuery, analysisController.listAnalyses);
router.post('/', validateCreateAnalysis, analysisController.createAnalysis);

router.get('/:analysisId', validateAnalysisIdParam, analysisController.getAnalysis);
router.delete('/:analysisId', validateAnalysisIdParam, analysisController.deleteAnalysis);

router.use('/:analysisId/skill-gaps', skillGapRoutes);
router.use('/:analysisId/career-alignments', careerAlignmentRoutes);

module.exports = router;
