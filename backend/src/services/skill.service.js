// src/services/skill.service.js
//
// Business logic for the shared skills reference list and the
// current user's profile_skills. Every profile-scoped operation goes
// through profileService.requireOwnedProfileId(userId) first, so the
// profile_id used in the query always belongs to the authenticated
// caller - it is never taken from the request.

const skillRepository = require('../repositories/skill.repository');
const profileService = require('./profile.service');
const AppError = require('../errors/app-error');

function toPublicSkill(row) {
  return { skillId: row.skill_id, skillName: row.skill_name };
}

async function listSkills({ search, page, limit }) {
  const offset = (page - 1) * limit;
  const rows = await skillRepository.list({ search, limit, offset });
  return rows.map(toPublicSkill);
}

async function listMySkills(userId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const rows = await skillRepository.listForProfile(profileId);
  return rows.map(toPublicSkill);
}

// Accepts either an existing skillId or a free-text skillName (which
// is looked up or created in the shared reference table). Exactly one
// of the two is expected - the controller/validation layer enforces that.
async function addMySkill(userId, { skillId, skillName }) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  let skill;
  if (skillId) {
    skill = await skillRepository.findById(skillId);
    if (!skill) {
      throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill not found');
    }
  } else {
    skill = await skillRepository.findOrCreateByName(skillName.trim());
  }

  await skillRepository.addToProfile(profileId, skill.skill_id);
  return toPublicSkill(skill);
}

async function removeMySkill(userId, skillId) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  const removed = await skillRepository.removeFromProfile(profileId, skillId);
  if (!removed) {
    throw new AppError(404, 'PROFILE_SKILL_NOT_FOUND', 'Skill is not on this profile');
  }
}

module.exports = {
  listSkills,
  listMySkills,
  addMySkill,
  removeMySkill,
};
