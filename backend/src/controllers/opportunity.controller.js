const opportunityService = require('../services/opportunity.service');

async function listOpportunities(req, res) {
  const { page, limit } = req.validatedQuery;
  const opportunities = await opportunityService.listOpportunities({ page, limit });
  res.status(200).json({ opportunities, page, limit });
}

async function getOpportunity(req, res) {
  const opportunity = await opportunityService.getOpportunity(req.params.opportunityId);
  res.status(200).json({ opportunity });
}

async function createOpportunity(req, res) {
  const opportunity = await opportunityService.createOpportunity(req.body);
  res.status(201).json({ opportunity });
}

async function updateOpportunity(req, res) {
  const opportunity = await opportunityService.updateOpportunity(req.params.opportunityId, req.body);
  res.status(200).json({ opportunity });
}

async function deleteOpportunity(req, res) {
  await opportunityService.deleteOpportunity(req.params.opportunityId);
  res.status(204).send();
}

async function listOpportunitySkills(req, res) {
  const skills = await opportunityService.listOpportunitySkills(req.params.opportunityId);
  res.status(200).json({ skills });
}

async function addOpportunitySkill(req, res) {
  const skill = await opportunityService.addOpportunitySkill(req.params.opportunityId, req.body);
  res.status(201).json({ skill });
}

async function removeOpportunitySkill(req, res) {
  await opportunityService.removeOpportunitySkill(req.params.opportunityId, req.params.skillId);
  res.status(204).send();
}

module.exports = {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  listOpportunitySkills,
  addOpportunitySkill,
  removeOpportunitySkill,
};
