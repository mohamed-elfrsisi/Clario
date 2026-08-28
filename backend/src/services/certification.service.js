// src/services/certification.service.js
//
// Same ownership pattern as educations/experiences: profile_id is
// resolved from the authenticated userId, then every read/update/delete
// goes through findOwned() so a nonexistent id and someone-else's id
// are both an identical 404.

const certificationRepository = require('../repositories/certification.repository');
const profileService = require('./profile.service');
const AppError = require('../errors/app-error');

function toPublicCertification(row) {
  return {
    certificationId: row.certification_id,
    profileId: row.profile_id,
    name: row.name,
    issuingOrganization: row.issuing_organization,
    issueDate: row.issue_date,
    expirationDate: row.expiration_date,
    credentialId: row.credential_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 23514 = PostgreSQL check_violation. The only CHECK on this table
// enforces expiration_date >= issue_date (when both are set), so a
// check violation here means exactly that.
function rethrowAsValidationIfDateCheck(err) {
  if (err.code === '23514') {
    throw new AppError(400, 'INVALID_DATE_RANGE', 'expiration_date must be on or after issue_date');
  }
  throw err;
}

async function listCertifications(userId, { page, limit }) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const offset = (page - 1) * limit;
  const rows = await certificationRepository.listForProfile(profileId, { limit, offset });
  return rows.map(toPublicCertification);
}

async function getCertification(userId, certificationId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const row = await certificationRepository.findOwned(certificationId, profileId);

  if (!row) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found');
  }

  return toPublicCertification(row);
}

async function createCertification(userId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  try {
    const created = await certificationRepository.create(profileId, fields);
    return toPublicCertification(created);
  } catch (err) {
    rethrowAsValidationIfDateCheck(err);
  }
}

async function updateCertification(userId, certificationId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  const existing = await certificationRepository.findOwned(certificationId, profileId);
  if (!existing) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found');
  }

  try {
    const updated = await certificationRepository.updateOwned(certificationId, profileId, fields);
    return toPublicCertification(updated);
  } catch (err) {
    rethrowAsValidationIfDateCheck(err);
  }
}

async function deleteCertification(userId, certificationId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const deleted = await certificationRepository.deleteOwned(certificationId, profileId);

  if (!deleted) {
    throw new AppError(404, 'CERTIFICATION_NOT_FOUND', 'Certification not found');
  }
}

module.exports = {
  listCertifications,
  getCertification,
  createCertification,
  updateCertification,
  deleteCertification,
};
