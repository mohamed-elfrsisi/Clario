// src/controllers/career-alignment.controller.js

const careerAlignmentService = require('../services/career-alignment.service');

async function listCareerAlignments(req, res) {
  const careerAlignments = await careerAlignmentService.listCareerAlignments(
    req.user.userId,
    req.params.analysisId
  );
  res.status(200).json({ careerAlignments });
}

async function getCareerAlignment(req, res) {
  const careerAlignment = await careerAlignmentService.getCareerAlignment(
    req.user.userId,
    req.params.analysisId,
    req.params.careerAlignmentId
  );
  res.status(200).json({ careerAlignment });
}

async function createCareerAlignment(req, res) {
  const careerAlignment = await careerAlignmentService.createCareerAlignment(
    req.user.userId,
    req.params.analysisId,
    req.body
  );
  res.status(201).json({ careerAlignment });
}

async function deleteCareerAlignment(req, res) {
  await careerAlignmentService.deleteCareerAlignment(
    req.user.userId,
    req.params.analysisId,
    req.params.careerAlignmentId
  );
  res.status(204).send();
}

module.exports = {
  listCareerAlignments,
  getCareerAlignment,
  createCareerAlignment,
  deleteCareerAlignment,
};
