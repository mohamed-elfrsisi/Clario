// src/services/career-alignment.service.js
//
// Deterministic skill matching only. Alignment values are derived from
// target_skills and opportunity_skills; client-supplied computed fields
// are never trusted.

const careerAlignmentRepository = require('../repositories/career-alignment.repository');
const careerTargetRepository = require('../repositories/career-target.repository');
const opportunityRepository = require('../repositories/opportunity.repository');
const analysisService = require('./analysis.service');
const AppError = require('../errors/app-error');

function toPublicCareerAlignment(row) {
  return {
    careerAlignmentId: row.career_alignment_id,
    analysisId: row.analysis_id,
    careerTargetId: row.career_target_id,
    alignmentScore: Number(row.alignment_score),
    matchingFactors: row.matching_factors,
    missingFactors: row.missing_factors,
    createdAt: row.created_at,
  };
}

function computeAlignment(targetSkills, opportunitySkills) {
  const targetSkillIds = new Set(targetSkills.map((skill) => skill.skill_id));
  const matched = opportunitySkills.filter((skill) => targetSkillIds.has(skill.skill_id));
  const missing = opportunitySkills.filter((skill) => !targetSkillIds.has(skill.skill_id));
  const alignmentScore = opportunitySkills.length === 0
    ? 100
    : Math.round((matched.length / opportunitySkills.length) * 100 * 100) / 100;

  return {
    alignmentScore,
    matchingFactors: matched.length ? matched.map((skill) => skill.skill_name).join(', ') : null,
    missingFactors: missing.length ? missing.map((skill) => skill.skill_name).join(', ') : null,
  };
}

async function requireOwnedTargetAndCompute(analysis, careerTargetId) {
  const careerTarget = await careerTargetRepository.findOwned(careerTargetId, analysis.profile_id);
  if (!careerTarget) {
    throw new AppError(404, 'CAREER_TARGET_NOT_FOUND', 'Career target not found');
  }

  // opportunity_id is an FK on analyses, and analyses are only reachable
  // through requireOwnedAnalysis, so this lookup cannot cross users.
  const opportunity = await opportunityRepository.findById(analysis.opportunity_id);
  if (!opportunity) {
    throw new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found');
  }

  const [targetSkills, opportunitySkills] = await Promise.all([
    careerTargetRepository.listSkills(careerTargetId),
    opportunityRepository.listSkills(analysis.opportunity_id),
  ]);

  return {
    careerTarget,
    ...computeAlignment(targetSkills, opportunitySkills),
  };
}

async function listCareerAlignments(userId, analysisId) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);
  const rows = await careerAlignmentRepository.listForAnalysis(analysis.analysis_id);
  return rows.map(toPublicCareerAlignment);
}

async function getCareerAlignment(userId, analysisId, careerAlignmentId) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);
  const row = await careerAlignmentRepository.findOwned(careerAlignmentId, analysis.analysis_id);
  if (!row) {
    throw new AppError(404, 'CAREER_ALIGNMENT_NOT_FOUND', 'Career alignment not found');
  }
  return toPublicCareerAlignment(row);
}

async function createCareerAlignment(userId, analysisId, { careerTargetId }) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);
  const computed = await requireOwnedTargetAndCompute(analysis, careerTargetId);

  const created = await careerAlignmentRepository.create(analysis.analysis_id, {
    careerTargetId,
    alignmentScore: computed.alignmentScore,
    matchingFactors: computed.matchingFactors,
    missingFactors: computed.missingFactors,
  });

  return toPublicCareerAlignment(created);
}

async function updateCareerAlignment(userId, analysisId, careerAlignmentId, { careerTargetId }) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);
  const existing = await careerAlignmentRepository.findOwned(careerAlignmentId, analysis.analysis_id);
  if (!existing) {
    throw new AppError(404, 'CAREER_ALIGNMENT_NOT_FOUND', 'Career alignment not found');
  }

  const computed = await requireOwnedTargetAndCompute(analysis, careerTargetId);
  const updated = await careerAlignmentRepository.updateOwned(careerAlignmentId, analysis.analysis_id, {
    careerTargetId,
    alignmentScore: computed.alignmentScore,
    matchingFactors: computed.matchingFactors,
    missingFactors: computed.missingFactors,
  });

  if (!updated) {
    throw new AppError(404, 'CAREER_ALIGNMENT_NOT_FOUND', 'Career alignment not found');
  }

  return toPublicCareerAlignment(updated);
}

async function deleteCareerAlignment(userId, analysisId, careerAlignmentId) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);
  const deleted = await careerAlignmentRepository.deleteOwned(careerAlignmentId, analysis.analysis_id);
  if (!deleted) {
    throw new AppError(404, 'CAREER_ALIGNMENT_NOT_FOUND', 'Career alignment not found');
  }
}

module.exports = {
  listCareerAlignments,
  getCareerAlignment,
  createCareerAlignment,
  updateCareerAlignment,
  deleteCareerAlignment,
  computeAlignment,
};
