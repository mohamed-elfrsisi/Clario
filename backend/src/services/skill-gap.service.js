// src/services/skill-gap.service.js
//
// Every operation resolves the owning analysis first via
// analysisService.requireOwnedAnalysis(userId, analysisId), which
// itself resolves the caller's profile_id and confirms the analysis
// belongs to it. A skill_gap can therefore never be read/created/
// updated/deleted through another user's analysis - the analysis_id
// path segment alone is never trusted.

const skillGapRepository = require('../repositories/skill-gap.repository');
const skillRepository = require('../repositories/skill.repository');
const analysisService = require('./analysis.service');
const AppError = require('../errors/app-error');

function toPublicSkillGap(row) {
  return {
    skillGapId: row.skill_gap_id,
    analysisId: row.analysis_id,
    skillId: row.skill_id,
    skillName: row.skill_name,
    currentLevel: row.current_level,
    requiredLevel: row.required_level,
    gapLevel: row.gap_level,
    priorityLevel: row.priority_level,
    notes: row.notes,
  };
}

// 23514 = PostgreSQL check_violation. The CHECK constraints that can
// be hit here are current_level/required_level (0-5) and
// priority_level (1-5) - validation middleware already rejects
// out-of-range values before this point, so this is a defense-in-depth
// translation, not the primary validation path.
function rethrowAsValidationIfRangeCheck(err) {
  if (err.code === '23514') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Level values are out of the allowed range');
  }
  throw err;
}

async function listSkillGaps(userId, analysisId) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);
  const rows = await skillGapRepository.listForAnalysis(analysis.analysis_id);
  return rows.map(toPublicSkillGap);
}

async function getSkillGap(userId, analysisId, skillGapId) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);
  const row = await skillGapRepository.findOwned(skillGapId, analysis.analysis_id);

  if (!row) {
    throw new AppError(404, 'SKILL_GAP_NOT_FOUND', 'Skill gap not found');
  }

  return toPublicSkillGap(row);
}

// No unique constraint exists on (analysis_id, skill_id) - rather than
// invent one, or silently allow duplicate rows for the same skill on
// the same analysis, this treats "create for a skill already present
// on this analysis" as an update to that existing row (same pattern
// already used for career-target/experience/project skill
// attachments elsewhere in this codebase).
async function createOrUpdateSkillGap(userId, analysisId, fields) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);

  const skill = await skillRepository.findById(fields.skillId);
  if (!skill) {
    throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  }

  const existing = await skillGapRepository.findByAnalysisAndSkill(
    analysis.analysis_id,
    fields.skillId
  );

  try {
    if (existing) {
      const updated = await skillGapRepository.updateOwned(
        existing.skill_gap_id,
        analysis.analysis_id,
        fields
      );
      return { skillGap: toPublicSkillGap({ ...updated, skill_name: skill.skill_name }), created: false };
    }

    const created = await skillGapRepository.create(analysis.analysis_id, fields);
    return { skillGap: toPublicSkillGap({ ...created, skill_name: skill.skill_name }), created: true };
  } catch (err) {
    rethrowAsValidationIfRangeCheck(err);
  }
}

async function updateSkillGap(userId, analysisId, skillGapId, fields) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);

  const existing = await skillGapRepository.findOwned(skillGapId, analysis.analysis_id);
  if (!existing) {
    throw new AppError(404, 'SKILL_GAP_NOT_FOUND', 'Skill gap not found');
  }

  try {
    const updated = await skillGapRepository.updateOwned(skillGapId, analysis.analysis_id, fields);
    return toPublicSkillGap({ ...updated, skill_name: existing.skill_name });
  } catch (err) {
    rethrowAsValidationIfRangeCheck(err);
  }
}

async function deleteSkillGap(userId, analysisId, skillGapId) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);
  const deleted = await skillGapRepository.deleteOwned(skillGapId, analysis.analysis_id);

  if (!deleted) {
    throw new AppError(404, 'SKILL_GAP_NOT_FOUND', 'Skill gap not found');
  }
}

module.exports = {
  listSkillGaps,
  getSkillGap,
  createOrUpdateSkillGap,
  updateSkillGap,
  deleteSkillGap,
};
