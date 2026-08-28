const express = require('express');
const documentController = require('../controllers/document.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validatePaginationQuery,
  validateDocumentIdParam,
  validateCreateDocument,
  validateUpdateDocument,
  validateUploadDocument,
} = require('../middleware/validation.middleware');

const router = express.Router();
router.use(requireAuth);

router.get('/', validatePaginationQuery, documentController.listDocuments);
router.post('/upload', express.raw({ type: '*/*', limit: '50mb' }), validateUploadDocument, documentController.uploadDocument);
router.post('/', validateCreateDocument, documentController.createDocument);
router.get('/:documentId', validateDocumentIdParam, documentController.getDocument);
router.put('/:documentId', validateDocumentIdParam, validateUpdateDocument, documentController.updateDocument);
router.delete('/:documentId', validateDocumentIdParam, documentController.deleteDocument);

module.exports = router;
