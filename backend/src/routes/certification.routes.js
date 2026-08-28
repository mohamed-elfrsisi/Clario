// src/routes/certification.routes.js
//
// All routes require authentication; ownership is enforced in the
// service layer via profile_id derived from req.user.userId.

const express = require('express');
const certificationController = require('../controllers/certification.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  validatePaginationQuery,
  validateCertificationIdParam,
  validateCreateCertification,
  validateUpdateCertification,
} = require('../middleware/validation.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', validatePaginationQuery, certificationController.listCertifications);
router.post('/', validateCreateCertification, certificationController.createCertification);

router.get('/:certificationId', validateCertificationIdParam, certificationController.getCertification);
router.put(
  '/:certificationId',
  validateCertificationIdParam,
  validateUpdateCertification,
  certificationController.updateCertification
);
router.delete(
  '/:certificationId',
  validateCertificationIdParam,
  certificationController.deleteCertification
);

module.exports = router;
