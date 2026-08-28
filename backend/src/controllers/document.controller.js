const documentService = require('../services/document.service');

async function listDocuments(req, res) {
  const { page, limit } = req.validatedQuery;
  const documents = await documentService.listDocuments(req.user.userId, { page, limit });
  res.status(200).json({ documents, page, limit });
}

async function getDocument(req, res) {
  const document = await documentService.getDocument(req.user.userId, req.params.documentId);
  res.status(200).json({ document });
}

async function createDocument(req, res) {
  const document = await documentService.createDocument(req.user.userId, req.body);
  res.status(201).json({ document });
}

async function uploadDocument(req, res) {
  const document = await documentService.uploadDocument(req.user.userId, {
    buffer: req.body,
    ...req.validatedUpload,
  });
  res.status(201).json({ document });
}

async function updateDocument(req, res) {
  const document = await documentService.updateDocument(req.user.userId, req.params.documentId, req.body);
  res.status(200).json({ document });
}

async function deleteDocument(req, res) {
  await documentService.deleteDocument(req.user.userId, req.params.documentId);
  res.status(204).send();
}

module.exports = { listDocuments, getDocument, createDocument, uploadDocument, updateDocument, deleteDocument };
