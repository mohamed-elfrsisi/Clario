// src/controllers/skill-gap.controller.js

const skillGapService = require('../services/skill-gap.service');

async function listSkillGaps(req, res) {
  const skillGaps = await skillGapService.listSkillGaps(req.user.userId, req.params.analysisId);
  res.status(200).json({ skillGaps });
}

async function getSkillGap(req, res) {
  const skillGap = await skillGapService.getSkillGap(
    req.user.userId,
    req.params.analysisId,
    req.params.skillGapId
  );
  res.status(200).json({ skillGap });
}

async function createSkillGap(req, res) {
  const { skillGap, created } = await skillGapService.createOrUpdateSkillGap(
    req.user.userId,
    req.params.analysisId,
    req.body
  );
  res.status(created ? 201 : 200).json({ skillGap });
}

async function updateSkillGap(req, res) {
  const skillGap = await skillGapService.updateSkillGap(
    req.user.userId,
    req.params.analysisId,
    req.params.skillGapId,
    req.body
  );
  res.status(200).json({ skillGap });
}

async function deleteSkillGap(req, res) {
  await skillGapService.deleteSkillGap(req.user.userId, req.params.analysisId, req.params.skillGapId);
  res.status(204).send();
}

module.exports = {
  listSkillGaps,
  getSkillGap,
  createSkillGap,
  updateSkillGap,
  deleteSkillGap,
};
