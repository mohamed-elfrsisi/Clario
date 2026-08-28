const express = require('express');
const opportunityController = require('../controllers/opportunity.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validatePaginationQuery,
  validateOpportunityIdParam,
  validateCreateOpportunity,
  validateUpdateOpportunity,
  validateAddOpportunitySkill,
  validateSkillIdParam,
} = require('../middleware/validation.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', validatePaginationQuery, opportunityController.listOpportunities);
router.post('/', validateCreateOpportunity, opportunityController.createOpportunity);
router.get('/:opportunityId', validateOpportunityIdParam, opportunityController.getOpportunity);
router.put('/:opportunityId', validateOpportunityIdParam, validateUpdateOpportunity, opportunityController.updateOpportunity);
router.delete('/:opportunityId', validateOpportunityIdParam, opportunityController.deleteOpportunity);

router.get('/:opportunityId/skills', validateOpportunityIdParam, opportunityController.listOpportunitySkills);
router.post('/:opportunityId/skills', validateOpportunityIdParam, validateAddOpportunitySkill, opportunityController.addOpportunitySkill);
router.delete('/:opportunityId/skills/:skillId', validateOpportunityIdParam, validateSkillIdParam, opportunityController.removeOpportunitySkill);

module.exports = router;
