// src/services/education.service.js
//
// Same ownership pattern as experiences: profile_id is resolved from
// the authenticated userId, then every read/update/delete goes
// through findOwned() so a nonexistent id and someone-else's id are
// both an identical 404.

const educationRepository = require('../repositories/education.repository');
const profileService = require('./profile.service');
const AppError = require('../errors/app-error');

function toPublicEducation(row) {
  return {
    educationId: row.education_id,
    profileId: row.profile_id,
    degree: row.degree,
    institution: row.institution,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 23514 = PostgreSQL check_violation. The only CHECK on this table
// enforces end_date >= start_date (when both are set), so a check
// violation here means exactly that.
function rethrowAsValidationIfDateCheck(err) {
  if (err.code === '23514') {
    throw new AppError(400, 'INVALID_DATE_RANGE', 'end_date must be on or after start_date');
  }
  throw err;
}

async function listEducations(userId, { page, limit }) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const offset = (page - 1) * limit;
  const rows = await educationRepository.listForProfile(profileId, { limit, offset });
  return rows.map(toPublicEducation);
}

async function getEducation(userId, educationId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const row = await educationRepository.findOwned(educationId, profileId);

  if (!row) {
    throw new AppError(404, 'EDUCATION_NOT_FOUND', 'Education entry not found');
  }

  return toPublicEducation(row);
}

async function createEducation(userId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  try {
    const created = await educationRepository.create(profileId, fields);
    return toPublicEducation(created);
  } catch (err) {
    rethrowAsValidationIfDateCheck(err);
  }
}

async function updateEducation(userId, educationId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  const existing = await educationRepository.findOwned(educationId, profileId);
  if (!existing) {
    throw new AppError(404, 'EDUCATION_NOT_FOUND', 'Education entry not found');
  }

  try {
    const updated = await educationRepository.updateOwned(educationId, profileId, fields);
    return toPublicEducation(updated);
  } catch (err) {
    rethrowAsValidationIfDateCheck(err);
  }
}

async function deleteEducation(userId, educationId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const deleted = await educationRepository.deleteOwned(educationId, profileId);

  if (!deleted) {
    throw new AppError(404, 'EDUCATION_NOT_FOUND', 'Education entry not found');
  }
}

module.exports = {
  listEducations,
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
};
