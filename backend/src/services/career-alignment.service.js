// src/services/career-alignment.service.js
//
// Deterministic skill matching only - no AI/ML, no fabricated scores.
// alignment_score/matching_factors/missing_factors are computed purely
// from set operations over two things the schema already tracks:
//   - target_skills for the caller's own career target
//   - opportunity_skills for the opportunity the parent analysis is against
// See computeAlignment() below for the exact, auditable formula.
// These fields are NEVER accepted from the client - a caller cannot
// fabricate their own alignment score.

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

// matched = opportunity skills also present in the career target's
// target_skills. missing = opportunity skills NOT present there.
// alignment_score = matched / total required opportunity skills * 100,
// rounded to 2 decimals. An opportunity with zero listed required
// skills has nothing to be misaligned on, so it scores 100 - this
// default is explicit and documented here, not silently assumed.
function computeAlignment(targetSkills, opportunitySkills) {
  const targetSkillIds = new Set(targetSkills.map((s) => s.skill_id));

  const matched = opportunitySkills.filter((s) => targetSkillIds.has(s.skill_id));
  const missing = opportunitySkills.filter((s) => !targetSkillIds.has(s.skill_id));

  const alignmentScore =
    opportunitySkills.length === 0
      ? 100
      : Math.round((matched.length / opportunitySkills.length) * 100 * 100) / 100;

  return {
    alignmentScore,
    matchingFactors: matched.length > 0 ? matched.map((s) => s.skill_name).join(', ') : null,
    missingFactors: missing.length > 0 ? missing.map((s) => s.skill_name).join(', ') : null,
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

// careerTargetId must belong to the same caller's profile as the
// analysis - never trusted as a bare foreign key. The opportunity used
// for matching is always analysis.opportunity_id (the opportunity the
// parent analysis is already scoped to), never a client-supplied value.
async function createCareerAlignment(userId, analysisId, { careerTargetId }) {
  const analysis = await analysisService.requireOwnedAnalysis(userId, analysisId);

  // requireOwnedAnalysis already resolved/validated the caller's
  // profile; re-derive profileId from the analysis row itself so this
  // function doesn't need a second profile lookup.
  const careerTarget = await careerTargetRepository.findOwned(careerTargetId, analysis.profile_id);
  if (!careerTarget) {
    throw new AppError(404, 'CAREER_TARGET_NOT_FOUND', 'Career target not found');
  }

  const [targetSkills, opportunitySkills] = await Promise.all([
    careerTargetRepository.listSkills(careerTargetId),
    opportunityRepository.listSkills(analysis.opportunity_id),
  ]);

  const { alignmentScore, matchingFactors, missingFactors } = computeAlignment(
    targetSkills,
    opportunitySkills
  );

  const created = await careerAlignmentRepository.create(analysis.analysis_id, {
    careerTargetId,
    alignmentScore,
    matchingFactors,
    missingFactors,
  });

  return toPublicCareerAlignment(created);
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
  deleteCareerAlignment,
  computeAlignment, // exported for unit/integration testing of the pure matching logic
};
