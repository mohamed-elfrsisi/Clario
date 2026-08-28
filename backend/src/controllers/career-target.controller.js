// src/controllers/career-target.controller.js

const careerTargetService = require('../services/career-target.service');

async function listCareerTargets(req, res) {
  const { page, limit } = req.validatedQuery;
  const careerTargets = await careerTargetService.listCareerTargets(req.user.userId, { page, limit });
  res.status(200).json({ careerTargets, page, limit });
}

async function getCareerTarget(req, res) {
  const careerTarget = await careerTargetService.getCareerTarget(
    req.user.userId,
    req.params.careerTargetId
  );
  res.status(200).json({ careerTarget });
}

async function createCareerTarget(req, res) {
  const careerTarget = await careerTargetService.createCareerTarget(req.user.userId, req.body);
  res.status(201).json({ careerTarget });
}

async function updateCareerTarget(req, res) {
  const careerTarget = await careerTargetService.updateCareerTarget(
    req.user.userId,
    req.params.careerTargetId,
    req.body
  );
  res.status(200).json({ careerTarget });
}

async function deleteCareerTarget(req, res) {
  await careerTargetService.deleteCareerTarget(req.user.userId, req.params.careerTargetId);
  res.status(204).send();
}

async function listTargetSkills(req, res) {
  const skills = await careerTargetService.listTargetSkills(req.user.userId, req.params.careerTargetId);
  res.status(200).json({ skills });
}

async function addTargetSkill(req, res) {
  const { skill, created } = await careerTargetService.addTargetSkill(
    req.user.userId,
    req.params.careerTargetId,
    req.body
  );
  res.status(created ? 201 : 200).json({ skill });
}

async function removeTargetSkill(req, res) {
  await careerTargetService.removeTargetSkill(
    req.user.userId,
    req.params.careerTargetId,
    req.params.skillId
  );
  res.status(204).send();
}

module.exports = {
  listCareerTargets,
  getCareerTarget,
  createCareerTarget,
  updateCareerTarget,
  deleteCareerTarget,
  listTargetSkills,
  addTargetSkill,
  removeTargetSkill,
};
