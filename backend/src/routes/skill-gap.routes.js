// src/routes/skill-gap.routes.js
//
// Mounted at /api/analyses/:analysisId/skill-gaps (mergeParams so
// req.params.analysisId is visible here). Every route resolves
// ownership through the parent analysis - see skill-gap.service.js.

const express = require('express');
const skillGapController = require('../controllers/skill-gap.controller');
const {
  validateAnalysisIdParam,
  validateSkillGapIdParam,
  validateCreateSkillGap,
  validateUpdateSkillGap,
} = require('../middleware/validation.middleware');

const router = express.Router({ mergeParams: true });

router.use(validateAnalysisIdParam);

router.get('/', skillGapController.listSkillGaps);
router.post('/', validateCreateSkillGap, skillGapController.createSkillGap);

router.get('/:skillGapId', validateSkillGapIdParam, skillGapController.getSkillGap);
router.put(
  '/:skillGapId',
  validateSkillGapIdParam,
  validateUpdateSkillGap,
  skillGapController.updateSkillGap
);
router.delete('/:skillGapId', validateSkillGapIdParam, skillGapController.deleteSkillGap);

module.exports = router;
