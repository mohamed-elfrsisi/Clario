// src/routes/document.routes.js
//
// All routes require authentication; ownership is enforced in the
// service layer via profile_id derived from req.user.userId.
// Metadata only - see document.service.js for scope notes.

const express = require('express');
const documentController = require('../controllers/document.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validatePaginationQuery,
  validateDocumentIdParam,
  validateCreateDocument,
  validateUpdateDocument,
} = require('../middleware/validation.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', validatePaginationQuery, documentController.listDocuments);
router.post('/', validateCreateDocument, documentController.createDocument);

router.get('/:documentId', validateDocumentIdParam, documentController.getDocument);
router.put(
  '/:documentId',
  validateDocumentIdParam,
  validateUpdateDocument,
  documentController.updateDocument
);
router.delete('/:documentId', validateDocumentIdParam, documentController.deleteDocument);

module.exports = router;
