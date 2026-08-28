// src/services/project.service.js
//
// Same ownership pattern as experience.service.js: every operation
// resolves the caller's own profile_id first via
// profileService.requireOwnedProfileId(userId), then scopes every
// query with that profile_id - never anything from the request body
// or URL. findOwned() means a nonexistent id and someone-else's id
// are both a plain 404, never distinguishable to the caller.

const { withTransaction } = require('../config/database');
const projectRepository = require('../repositories/project.repository');
const skillRepository = require('../repositories/skill.repository');
const profileService = require('./profile.service');
const AppError = require('../errors/app-error');

function toPublicProject(row) {
  return {
    projectId: row.project_id,
    profileId: row.profile_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    url: row.url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicSkill(row) {
  return { skillId: row.skill_id, skillName: row.skill_name };
}

// 23514 = PostgreSQL check_violation. The only CHECK constraint on
// this table enforces end_date >= start_date (when both are set),
// so any check violation here means exactly that.
function rethrowAsValidationIfDateCheck(err) {
  if (err.code === '23514') {
    throw new AppError(400, 'INVALID_DATE_RANGE', 'end_date must be on or after start_date');
  }
  throw err;
}

async function listProjects(userId, { page, limit }) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const offset = (page - 1) * limit;
  const rows = await projectRepository.listForProfile(profileId, { limit, offset });
  return rows.map(toPublicProject);
}

async function getProject(userId, projectId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const row = await projectRepository.findOwned(projectId, profileId);

  if (!row) {
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  }

  return toPublicProject(row);
}

// skillNames is an optional array of free-text skill names to attach
// at creation time - identical pattern to createExperience. Either the
// project and all its skills are saved together, or none of it is.
async function createProject(userId, { skillNames, ...fields }) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  try {
    return await withTransaction(async (client) => {
      const created = await projectRepository.create(profileId, fields, client);

      const attachedSkills = [];
      for (const rawName of skillNames || []) {
        const skill = await skillRepository.findOrCreateByName(rawName.trim(), client);
        await projectRepository.addSkill(created.project_id, skill.skill_id, client);
        attachedSkills.push(toPublicSkill(skill));
      }

      return { ...toPublicProject(created), skills: attachedSkills };
    });
  } catch (err) {
    rethrowAsValidationIfDateCheck(err);
  }
}

async function updateProject(userId, projectId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  const existing = await projectRepository.findOwned(projectId, profileId);
  if (!existing) {
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  }

  try {
    const updated = await projectRepository.updateOwned(projectId, profileId, fields);
    return toPublicProject(updated);
  } catch (err) {
    rethrowAsValidationIfDateCheck(err);
  }
}

async function deleteProject(userId, projectId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const deleted = await projectRepository.deleteOwned(projectId, profileId);

  if (!deleted) {
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  }
}

async function requireOwnedProjectId(userId, projectId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const existing = await projectRepository.findOwned(projectId, profileId);

  if (!existing) {
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  }

  return existing.project_id;
}

async function listProjectSkills(userId, projectId) {
  const ownedId = await requireOwnedProjectId(userId, projectId);
  const rows = await projectRepository.listSkills(ownedId);
  return rows.map(toPublicSkill);
}

async function addProjectSkill(userId, projectId, { skillId, skillName }) {
  const ownedId = await requireOwnedProjectId(userId, projectId);

  let skill;
  if (skillId) {
    skill = await skillRepository.findById(skillId);
    if (!skill) {
      throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill not found');
    }
  } else {
    skill = await skillRepository.findOrCreateByName(skillName.trim());
  }

  await projectRepository.addSkill(ownedId, skill.skill_id);
  return toPublicSkill(skill);
}

async function removeProjectSkill(userId, projectId, skillId) {
  const ownedId = await requireOwnedProjectId(userId, projectId);

  const removed = await projectRepository.removeSkill(ownedId, skillId);
  if (!removed) {
    throw new AppError(404, 'PROJECT_SKILL_NOT_FOUND', 'Skill is not on this project');
  }
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listProjectSkills,
  addProjectSkill,
  removeProjectSkill,
};
