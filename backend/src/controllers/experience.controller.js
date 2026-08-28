// src/controllers/experience.controller.js

const experienceService = require('../services/experience.service');

async function listExperiences(req, res) {
  const { page, limit } = req.validatedQuery;
  const experiences = await experienceService.listExperiences(req.user.userId, { page, limit });
  res.status(200).json({ experiences, page, limit });
}

async function getExperience(req, res) {
  const experience = await experienceService.getExperience(req.user.userId, req.params.experienceId);
  res.status(200).json({ experience });
}

async function createExperience(req, res) {
  const experience = await experienceService.createExperience(req.user.userId, req.body);
  res.status(201).json({ experience });
}

async function updateExperience(req, res) {
  const experience = await experienceService.updateExperience(
    req.user.userId,
    req.params.experienceId,
    req.body
  );
  res.status(200).json({ experience });
}

async function deleteExperience(req, res) {
  await experienceService.deleteExperience(req.user.userId, req.params.experienceId);
  res.status(204).send();
}

async function listExperienceSkills(req, res) {
  const skills = await experienceService.listExperienceSkills(req.user.userId, req.params.experienceId);
  res.status(200).json({ skills });
}

async function addExperienceSkill(req, res) {
  const skill = await experienceService.addExperienceSkill(
    req.user.userId,
    req.params.experienceId,
    req.body
  );
  res.status(201).json({ skill });
}

async function removeExperienceSkill(req, res) {
  await experienceService.removeExperienceSkill(
    req.user.userId,
    req.params.experienceId,
    req.params.skillId
  );
  res.status(204).send();
}

module.exports = {
  listExperiences,
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience,
  listExperienceSkills,
  addExperienceSkill,
  removeExperienceSkill,
};
