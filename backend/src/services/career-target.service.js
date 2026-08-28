// src/services/career-target.service.js
//
// Every operation resolves the caller's own profile_id first via
// profileService.requireOwnedProfileId(userId), then uses that
// profile_id (never anything from the request) to scope every query.
// Reads/updates/deletes additionally use findOwned(), which only
// returns a row when it belongs to that profile_id - so a caller can
// never touch another user's career target, and a nonexistent id and
// someone-else's id are indistinguishable (both 404).

const careerTargetRepository = require('../repositories/career-target.repository');
const skillRepository = require('../repositories/skill.repository');
const profileService = require('./profile.service');
const AppError = require('../errors/app-error');

const DEFAULT_IMPORTANCE_LEVEL = 3;

function toPublicCareerTarget(row) {
  return {
    careerTargetId: row.career_target_id,
    profileId: row.profile_id,
    targetRole: row.target_role,
    targetIndustry: row.target_industry,
    targetLevel: row.target_level,
    targetRegion: row.target_region,
    timeframe: row.timeframe,
    additionalNotes: row.additional_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicTargetSkill(row) {
  return {
    skillId: row.skill_id,
    skillName: row.skill_name,
    importanceLevel: row.importance_level,
  };
}

// 23514 = PostgreSQL check_violation. The only CHECK constraint that
// can be hit by these operations is target_skills_importance_level_range
// (1-5), so a check violation here means exactly that.
function rethrowAsValidationIfImportanceCheck(err) {
  if (err.code === '23514') {
    throw new AppError(400, 'VALIDATION_ERROR', 'importanceLevel must be between 1 and 5');
  }
  throw err;
}

async function listCareerTargets(userId, { page, limit }) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const offset = (page - 1) * limit;
  const rows = await careerTargetRepository.listForProfile(profileId, { limit, offset });
  return rows.map(toPublicCareerTarget);
}

async function getCareerTarget(userId, careerTargetId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const row = await careerTargetRepository.findOwned(careerTargetId, profileId);

  if (!row) {
    throw new AppError(404, 'CAREER_TARGET_NOT_FOUND', 'Career target not found');
  }

  return toPublicCareerTarget(row);
}

async function createCareerTarget(userId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const created = await careerTargetRepository.create(profileId, fields);
  return toPublicCareerTarget(created);
}

async function updateCareerTarget(userId, careerTargetId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  const existing = await careerTargetRepository.findOwned(careerTargetId, profileId);
  if (!existing) {
    throw new AppError(404, 'CAREER_TARGET_NOT_FOUND', 'Career target not found');
  }

  const updated = await careerTargetRepository.updateOwned(careerTargetId, profileId, fields);
  return toPublicCareerTarget(updated);
}

async function deleteCareerTarget(userId, careerTargetId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const deleted = await careerTargetRepository.deleteOwned(careerTargetId, profileId);

  if (!deleted) {
    throw new AppError(404, 'CAREER_TARGET_NOT_FOUND', 'Career target not found');
  }
}

async function requireOwnedCareerTargetId(userId, careerTargetId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const existing = await careerTargetRepository.findOwned(careerTargetId, profileId);

  if (!existing) {
    throw new AppError(404, 'CAREER_TARGET_NOT_FOUND', 'Career target not found');
  }

  return existing.career_target_id;
}

async function listTargetSkills(userId, careerTargetId) {
  const ownedId = await requireOwnedCareerTargetId(userId, careerTargetId);
  const rows = await careerTargetRepository.listSkills(ownedId);
  return rows.map(toPublicTargetSkill);
}

// Returns { skill, created } - `created` is true for a brand-new
// attachment (caller should respond 201) and false when this call
// updated the importance_level of an already-attached skill (caller
// should respond 200).
async function addTargetSkill(userId, careerTargetId, { skillId, skillName, importanceLevel }) {
  const ownedId = await requireOwnedCareerTargetId(userId, careerTargetId);

  let skill;
  if (skillId) {
    skill = await skillRepository.findById(skillId);
    if (!skill) {
      throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill not found');
    }
  } else {
    skill = await skillRepository.findOrCreateByName(skillName.trim());
  }

  const level = importanceLevel === undefined ? DEFAULT_IMPORTANCE_LEVEL : importanceLevel;

  try {
    const link = await careerTargetRepository.addSkill(ownedId, skill.skill_id, level);
    return {
      skill: { ...toPublicTargetSkill({ ...skill, importance_level: link.importance_level }) },
      created: link.inserted,
    };
  } catch (err) {
    rethrowAsValidationIfImportanceCheck(err);
  }
}

async function removeTargetSkill(userId, careerTargetId, skillId) {
  const ownedId = await requireOwnedCareerTargetId(userId, careerTargetId);

  const removed = await careerTargetRepository.removeSkill(ownedId, skillId);
  if (!removed) {
    throw new AppError(404, 'TARGET_SKILL_NOT_FOUND', 'Skill is not on this career target');
  }
}

module.exports = {
  listCareerTargets,
  getCareerTarget,
  createCareerTarget,
  updateCareerTarget,
  deleteCareerTarget,
  listTargetSkills,
  addTargetSkill,
  removeTargetSkill,
};
