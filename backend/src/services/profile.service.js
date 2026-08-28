// src/services/profile.service.js
//
// Business logic for profiles. Ownership is always derived from the
// authenticated userId passed in by the controller (from req.user) -
// never from a client-supplied profile_id or user_id in the request
// body, so a caller can never read or write another user's profile.

const profileRepository = require('../repositories/profile.repository');
const AppError = require('../errors/app-error');

function toPublicProfile(row) {
  return {
    profileId: row.profile_id,
    userId: row.user_id,
    fullName: row.full_name,
    fieldOfStudy: row.field_of_study,
    region: row.region,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createProfile(userId, input) {
  const existing = await profileRepository.findByUserId(userId);
  if (existing) {
    throw new AppError(409, 'PROFILE_ALREADY_EXISTS', 'Profile already exists for this user');
  }

  let profile;
  try {
    profile = await profileRepository.create(userId, input);
  } catch (err) {
    // 23505 = unique_violation. Covers the race where two requests to
    // create a profile for the same user land concurrently.
    if (err.code === '23505') {
      throw new AppError(409, 'PROFILE_ALREADY_EXISTS', 'Profile already exists for this user');
    }
    throw err;
  }

  return toPublicProfile(profile);
}

async function getMyProfile(userId) {
  const profile = await profileRepository.findByUserId(userId);

  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found');
  }

  return toPublicProfile(profile);
}

async function updateMyProfile(userId, input) {
  const existing = await profileRepository.findByUserId(userId);
  if (!existing) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found');
  }

  const updated = await profileRepository.updateByUserId(userId, input);
  return toPublicProfile(updated);
}

// Used by other services (e.g. skills) that need the profile_id owned
// by the current user without exposing the full profile shape.
async function requireOwnedProfileId(userId) {
  const profile = await profileRepository.findByUserId(userId);
  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found');
  }
  return profile.profile_id;
}

module.exports = {
  createProfile,
  getMyProfile,
  updateMyProfile,
  requireOwnedProfileId,
};
