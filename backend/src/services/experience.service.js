// src/services/experience.service.js
//
// Every operation resolves the caller's own profile_id first via
// profileService.requireOwnedProfileId(userId), then uses that
// profile_id (never anything from the request) to scope every query.
// Reads/updates/deletes additionally use findOwned(), which only
// returns a row when it belongs to that profile_id - so a caller can
// never touch another user's experience, and a nonexistent id and a
// someone-else's id are indistinguishable (both 404).

const { withTransaction } = require('../config/database');
const experienceRepository = require('../repositories/experience.repository');
const skillRepository = require('../repositories/skill.repository');
const profileService = require('./profile.service');
const AppError = require('../errors/app-error');

function toPublicExperience(row) {
  return {
    experienceId: row.experience_id,
    profileId: row.profile_id,
    title: row.title,
    company: row.company,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicSkill(row) {
  return { skillId: row.skill_id, skillName: row.skill_name };
}

// 23514 = PostgreSQL check_violation. The only CHECK constraint on
// this table enforces end_date >= start_date, so any check violation
// here means exactly that - safe to report specifically.
function rethrowAsValidationIfDateCheck(err) {
  if (err.code === '23514') {
    throw new AppError(400, 'INVALID_DATE_RANGE', 'end_date must be on or after start_date');
  }
  throw err;
}

async function listExperiences(userId, { page, limit }) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const offset = (page - 1) * limit;
  const rows = await experienceRepository.listForProfile(profileId, { limit, offset });
  return rows.map(toPublicExperience);
}

async function getExperience(userId, experienceId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const row = await experienceRepository.findOwned(experienceId, profileId);

  if (!row) {
    throw new AppError(404, 'EXPERIENCE_NOT_FOUND', 'Experience not found');
  }

  return toPublicExperience(row);
}

// skillNames is an optional array of free-text skill names to attach
// at creation time. When present, experience creation + every skill
// lookup/create/attach happens inside one transaction: either the
// experience and all its skills are saved together, or none of it is.
async function createExperience(userId, { skillNames, ...fields }) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  try {
    return await withTransaction(async (client) => {
      const created = await experienceRepository.create(profileId, fields, client);

      const attachedSkills = [];
      for (const rawName of skillNames || []) {
        const skill = await skillRepository.findOrCreateByName(rawName.trim(), client);
        await experienceRepository.addSkill(created.experience_id, skill.skill_id, client);
        attachedSkills.push(toPublicSkill(skill));
      }

      return { ...toPublicExperience(created), skills: attachedSkills };
    });
  } catch (err) {
    rethrowAsValidationIfDateCheck(err);
  }
}

async function updateExperience(userId, experienceId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  const existing = await experienceRepository.findOwned(experienceId, profileId);
  if (!existing) {
    throw new AppError(404, 'EXPERIENCE_NOT_FOUND', 'Experience not found');
  }

  try {
    const updated = await experienceRepository.updateOwned(experienceId, profileId, fields);
    return toPublicExperience(updated);
  } catch (err) {
    rethrowAsValidationIfDateCheck(err);
  }
}

async function deleteExperience(userId, experienceId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const deleted = await experienceRepository.deleteOwned(experienceId, profileId);

  if (!deleted) {
    throw new AppError(404, 'EXPERIENCE_NOT_FOUND', 'Experience not found');
  }
}

async function requireOwnedExperienceId(userId, experienceId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const existing = await experienceRepository.findOwned(experienceId, profileId);

  if (!existing) {
    throw new AppError(404, 'EXPERIENCE_NOT_FOUND', 'Experience not found');
  }

  return existing.experience_id;
}

async function listExperienceSkills(userId, experienceId) {
  const ownedId = await requireOwnedExperienceId(userId, experienceId);
  const rows = await experienceRepository.listSkills(ownedId);
  return rows.map(toPublicSkill);
}

async function addExperienceSkill(userId, experienceId, { skillId, skillName }) {
  const ownedId = await requireOwnedExperienceId(userId, experienceId);

  let skill;
  if (skillId) {
    skill = await skillRepository.findById(skillId);
    if (!skill) {
      throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill not found');
    }
  } else {
    skill = await skillRepository.findOrCreateByName(skillName.trim());
  }

  await experienceRepository.addSkill(ownedId, skill.skill_id);
  return toPublicSkill(skill);
}

async function removeExperienceSkill(userId, experienceId, skillId) {
  const ownedId = await requireOwnedExperienceId(userId, experienceId);

  const removed = await experienceRepository.removeSkill(ownedId, skillId);
  if (!removed) {
    throw new AppError(404, 'EXPERIENCE_SKILL_NOT_FOUND', 'Skill is not on this experience');
  }
}

module.exports = {
  listExperiences,
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience,
  listExperienceSkills,
  addExperienceSkill,
  removeExperienceSkill,
};
