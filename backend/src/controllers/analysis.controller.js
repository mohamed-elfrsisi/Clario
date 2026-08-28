// src/controllers/analysis.controller.js

const analysisService = require('../services/analysis.service');

async function listAnalyses(req, res) {
  const { page, limit } = req.validatedQuery;
  const analyses = await analysisService.listAnalyses(req.user.userId, { page, limit });
  res.status(200).json({ analyses, page, limit });
}

async function getAnalysis(req, res) {
  const analysis = await analysisService.getAnalysis(req.user.userId, req.params.analysisId);
  res.status(200).json({ analysis });
}

async function createAnalysis(req, res) {
  const analysis = await analysisService.createAnalysis(req.user.userId, req.body);
  res.status(201).json({ analysis });
}

async function deleteAnalysis(req, res) {
  await analysisService.deleteAnalysis(req.user.userId, req.params.analysisId);
  res.status(204).send();
}

module.exports = {
  listAnalyses,
  getAnalysis,
  createAnalysis,
  deleteAnalysis,
};
