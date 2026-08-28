// src/controllers/skill.controller.js

const skillService = require('../services/skill.service');

async function listSkills(req, res) {
  const { search } = req.query;
  const { page, limit } = req.validatedQuery;
  const skills = await skillService.listSkills({ search, page, limit });
  res.status(200).json({ skills, page, limit });
}

async function listMySkills(req, res) {
  const skills = await skillService.listMySkills(req.user.userId);
  res.status(200).json({ skills });
}

async function addMySkill(req, res) {
  const skill = await skillService.addMySkill(req.user.userId, req.body);
  res.status(201).json({ skill });
}

async function removeMySkill(req, res) {
  await skillService.removeMySkill(req.user.userId, req.params.skillId);
  res.status(204).send();
}

module.exports = {
  listSkills,
  listMySkills,
  addMySkill,
  removeMySkill,
};
