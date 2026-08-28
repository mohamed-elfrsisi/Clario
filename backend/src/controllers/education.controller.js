// src/controllers/education.controller.js

const educationService = require('../services/education.service');

async function listEducations(req, res) {
  const { page, limit } = req.validatedQuery;
  const educations = await educationService.listEducations(req.user.userId, { page, limit });
  res.status(200).json({ educations, page, limit });
}

async function getEducation(req, res) {
  const education = await educationService.getEducation(req.user.userId, req.params.educationId);
  res.status(200).json({ education });
}

async function createEducation(req, res) {
  const education = await educationService.createEducation(req.user.userId, req.body);
  res.status(201).json({ education });
}

async function updateEducation(req, res) {
  const education = await educationService.updateEducation(
    req.user.userId,
    req.params.educationId,
    req.body
  );
  res.status(200).json({ education });
}

async function deleteEducation(req, res) {
  await educationService.deleteEducation(req.user.userId, req.params.educationId);
  res.status(204).send();
}

module.exports = {
  listEducations,
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
};
