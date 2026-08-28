// src/controllers/certification.controller.js

const certificationService = require('../services/certification.service');

async function listCertifications(req, res) {
  const { page, limit } = req.validatedQuery;
  const certifications = await certificationService.listCertifications(req.user.userId, { page, limit });
  res.status(200).json({ certifications, page, limit });
}

async function getCertification(req, res) {
  const certification = await certificationService.getCertification(
    req.user.userId,
    req.params.certificationId
  );
  res.status(200).json({ certification });
}

async function createCertification(req, res) {
  const certification = await certificationService.createCertification(req.user.userId, req.body);
  res.status(201).json({ certification });
}

async function updateCertification(req, res) {
  const certification = await certificationService.updateCertification(
    req.user.userId,
    req.params.certificationId,
    req.body
  );
  res.status(200).json({ certification });
}

async function deleteCertification(req, res) {
  await certificationService.deleteCertification(req.user.userId, req.params.certificationId);
  res.status(204).send();
}

module.exports = {
  listCertifications,
  getCertification,
  createCertification,
  updateCertification,
  deleteCertification,
};
