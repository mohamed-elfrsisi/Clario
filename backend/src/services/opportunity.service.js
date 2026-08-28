// src/services/opportunity.service.js
// Opportunities are shared reference data, not profile-owned rows.
// Authentication is therefore the authorization boundary: ownership
// checks are intentionally not fabricated where the schema has no owner.

const opportunityRepository = require('../repositories/opportunity.repository');
const skillRepository = require('../repositories/skill.repository');
const AppError = require('../errors/app-error');

function toPublicOpportunity(row, skills) {
  return {
    opportunityId: row.opportunity_id,
    title: row.title,
    organization: row.organization,
    description: row.description,
    jobUrl: row.job_url,
    region: row.region,
    roleType: row.role_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(skills ? { skills: skills.map(toPublicSkill) } : {}),
  };
}

function toPublicSkill(row) {
  return {
    skillId: row.skill_id,
    skillName: row.skill_name,
    ...(row.importance_level !== undefined ? { importanceLevel: row.importance_level } : {}),
  };
}

function mapDatabaseError(err) {
  if (err?.code === '23503') {
    throw new AppError(409, 'FOREIGN_KEY_RESTRICTION', 'Resource is still referenced by other data');
  }
  if (err?.code === '23505') {
    throw new AppError(409, 'CONFLICT', 'Resource conflicts with existing data');
  }
  if (err?.code === '23514') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Input violates a database constraint');
  }
  throw err;
}

async function listOpportunities({ page, limit }) {
  const offset = (page - 1) * limit;
  const rows = await opportunityRepository.list({ limit, offset });
  return rows.map((row) => toPublicOpportunity(row));
}

async function getOpportunity(opportunityId) {
  const row = await opportunityRepository.findById(opportunityId);
  if (!row) throw new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found');
  const skills = await opportunityRepository.listSkills(opportunityId);
  return toPublicOpportunity(row, skills);
}

async function createOpportunity(fields) {
  try {
    return toPublicOpportunity(await opportunityRepository.create(fields));
  } catch (err) {
    mapDatabaseError(err);
  }
}

async function updateOpportunity(opportunityId, fields) {
  const existing = await opportunityRepository.findById(opportunityId);
  if (!existing) throw new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found');

  const merged = {
    title: fields.title === undefined ? existing.title : fields.title,
    organization: fields.organization === undefined ? existing.organization : fields.organization,
    description: fields.description === undefined ? existing.description : fields.description,
    jobUrl: fields.jobUrl === undefined ? existing.job_url : fields.jobUrl,
    region: fields.region === undefined ? existing.region : fields.region,
    roleType: fields.roleType === undefined ? existing.role_type : fields.roleType,
  };

  try {
    return toPublicOpportunity(await opportunityRepository.update(opportunityId, merged));
  } catch (err) {
    mapDatabaseError(err);
  }
}

async function deleteOpportunity(opportunityId) {
  try {
    const deleted = await opportunityRepository.deleteById(opportunityId);
    if (!deleted) throw new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found');
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDatabaseError(err);
  }
}

async function requireOpportunity(opportunityId) {
  const row = await opportunityRepository.findById(opportunityId);
  if (!row) throw new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found');
  return row;
}

async function listOpportunitySkills(opportunityId) {
  await requireOpportunity(opportunityId);
  const rows = await opportunityRepository.listSkills(opportunityId);
  return rows.map(toPublicSkill);
}

async function addOpportunitySkill(opportunityId, { skillId, skillName, importanceLevel }) {
  await requireOpportunity(opportunityId);

  try {
    const skill = skillId
      ? await skillRepository.findById(skillId)
      : await skillRepository.findOrCreateByName(skillName.trim());

    if (!skill) throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill not found');

    const relation = await opportunityRepository.addSkill(
      opportunityId,
      skill.skill_id,
      importanceLevel === undefined ? 3 : importanceLevel
    );

    if (!relation) {
      throw new AppError(409, 'CONFLICT', 'Skill is already associated with this opportunity');
    }

    return {
      skillId: skill.skill_id,
      skillName: skill.skill_name,
      importanceLevel: relation.importance_level,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDatabaseError(err);
  }
}

async function removeOpportunitySkill(opportunityId, skillId) {
  await requireOpportunity(opportunityId);
  const removed = await opportunityRepository.removeSkill(opportunityId, skillId);
  if (!removed) throw new AppError(404, 'OPPORTUNITY_SKILL_NOT_FOUND', 'Skill is not associated with this opportunity');
}


module.exports = {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  listOpportunitySkills,
  addOpportunitySkill,
  removeOpportunitySkill,
};
