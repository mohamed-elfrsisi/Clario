// src/services/analysis.service.js
//
// SCOPE NOTE: this backend has no AI/analysis-generation engine. This
// service only persists/retrieves the analysis record itself and its
// two foreign keys (document, opportunity) - match_percentage,
// parseability_score and summary are never set here and always come
// back null until a future analysis-generation phase populates them.
// Do not add fields here that aren't already columns on `analyses`.

const analysisRepository = require('../repositories/analysis.repository');
const documentRepository = require('../repositories/document.repository');
const opportunityRepository = require('../repositories/opportunity.repository');
const profileService = require('./profile.service');
const AppError = require('../errors/app-error');

function toPublicAnalysis(row) {
  return {
    analysisId: row.analysis_id,
    profileId: row.profile_id,
    documentId: row.document_id,
    opportunityId: row.opportunity_id,
    analysisDate: row.analysis_date,
    matchPercentage: row.match_percentage === null ? null : Number(row.match_percentage),
    parseabilityScore: row.parseability_score === null ? null : Number(row.parseability_score),
    summary: row.summary,
    createdAt: row.created_at,
  };
}

async function listAnalyses(userId, { page, limit }) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const offset = (page - 1) * limit;
  const rows = await analysisRepository.listForProfile(profileId, { limit, offset });
  return rows.map(toPublicAnalysis);
}

async function getAnalysis(userId, analysisId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const row = await analysisRepository.findOwned(analysisId, profileId);

  if (!row) {
    throw new AppError(404, 'ANALYSIS_NOT_FOUND', 'Analysis not found');
  }

  return toPublicAnalysis(row);
}

// Used by the skill-gaps and career-alignments services to confirm the
// caller owns the parent analysis before touching any sub-resource.
// Returns the raw row (not the public shape) since callers need
// analysis.opportunity_id internally (see career-alignment.service.js).
async function requireOwnedAnalysis(userId, analysisId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const row = await analysisRepository.findOwned(analysisId, profileId);

  if (!row) {
    throw new AppError(404, 'ANALYSIS_NOT_FOUND', 'Analysis not found');
  }

  return row;
}

// The document and opportunity referenced by an analysis are both
// validated here, before the row is created - never trusted as bare
// foreign keys from the client:
//   - documentId must be owned by the caller's own profile (documents
//     are user-owned data - Step "Do not allow users to create
//     analyses using another user's resources").
//   - opportunityId must exist. Opportunities are shared reference
//     data with no owner column in the approved schema (see
//     opportunity.repository.js) - there is no per-user ownership to
//     check for them, only existence.
async function createAnalysis(userId, { documentId, opportunityId }) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  const document = await documentRepository.findOwned(documentId, profileId);
  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  const opportunity = await opportunityRepository.findById(opportunityId);
  if (!opportunity) {
    throw new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found');
  }

  const created = await analysisRepository.create(profileId, { documentId, opportunityId });
  return toPublicAnalysis(created);
}

async function deleteAnalysis(userId, analysisId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const deleted = await analysisRepository.deleteOwned(analysisId, profileId);

  if (!deleted) {
    throw new AppError(404, 'ANALYSIS_NOT_FOUND', 'Analysis not found');
  }
}

module.exports = {
  listAnalyses,
  getAnalysis,
  requireOwnedAnalysis,
  createAnalysis,
  deleteAnalysis,
};
