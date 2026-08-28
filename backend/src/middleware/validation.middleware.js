// src/middleware/validation.middleware.js
//
// Request-shape validation belongs before controllers. This keeps
// controllers focused on HTTP orchestration instead of repeating
// validation logic for every endpoint.

const AppError = require("../errors/app-error");

function validateUserEmailQuery(req, res, next) {
  const { email } = req.query;

  if (email === undefined) {
    return next(
      new AppError(400, "VALIDATION_ERROR", "Email is required")
    );
  }

  if (typeof email !== "string" || email.trim() === "") {
    return next(
      new AppError(400, "VALIDATION_ERROR", "Invalid email")
    );
  }

  const normalizedEmail = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    return next(
      new AppError(400, "VALIDATION_ERROR", "Invalid email")
    );
  }

  // PHASE 9 BUG FIX: in Express 5, req.query is a getter that re-parses
  // the URL from scratch on every access (unlike Express 4, where it
  // was a plain cached object) - see request.js's `defineGetter(req,
  // 'query', ...)`. Writing `req.query.email = normalizedEmail` here
  // used to silently vanish by the time the controller read req.query
  // again, one stack frame later. req.validatedQuery is a plain object
  // we control, so it survives.
  req.validatedQuery = { ...req.validatedQuery, email: normalizedEmail };

  next();
}

function validateRegistration(req, res, next) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || email.trim() === '') {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'Email is required')
    );
  }

  const normalizedEmail = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'Invalid email')
    );
  }

  if (typeof password !== 'string' || password.length === 0) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'Password is required')
    );
  }

  if (password.length < 8) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'Password must be at least 8 characters')
    );
  }

  if (password.length > 128) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'Password must not exceed 128 characters')
    );
  }

  req.body.email = normalizedEmail;
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || email.trim() === '') {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Email is required'));
  }

  const normalizedEmail = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid email'));
  }

  if (typeof password !== 'string' || password.length === 0) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Password is required'));
  }

  if (password.length > 128) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'Password must not exceed 128 characters')
    );
  }

  req.body.email = normalizedEmail;
  next();
}

// --- Profiles ---------------------------------------------------------

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isNonEmptyTrimmedString(value, maxLength) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

// Shared by create + update: every field is optional on update, but
// whatever IS present must be well-formed on both. Presence rules are
// applied by the caller (validateCreateProfile requires nothing extra
// today since every profile column besides user_id is nullable).
function validateProfileFields(req, res, next) {
  const { fullName, fieldOfStudy, region } = req.body || {};

  for (const [key, value] of Object.entries({ fullName, fieldOfStudy, region })) {
    if (value === undefined) continue; // optional field, not being set

    if (value !== null && !isNonEmptyTrimmedString(value, 255)) {
      return next(
        new AppError(400, 'VALIDATION_ERROR', `${key} must be a non-empty string of at most 255 characters, or null`)
      );
    }
  }

  next();
}

// --- Skills -------------------------------------------------------------

function validateUuidParam(paramName) {
  return function (req, res, next) {
    const value = req.params[paramName];

    if (!UUID_PATTERN.test(value)) {
      return next(new AppError(400, 'VALIDATION_ERROR', `Invalid ${paramName}`));
    }

    next();
  };
}

function validateSkillIdParam(req, res, next) {
  validateUuidParam('skillId')(req, res, next);
}

function validateExperienceIdParam(req, res, next) {
  validateUuidParam('experienceId')(req, res, next);
}

function validateAddSkill(req, res, next) {
  const { skillId, skillName } = req.body || {};

  const hasId = skillId !== undefined;
  const hasName = skillName !== undefined;

  if (hasId === hasName) {
    // both provided or neither provided
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'Provide exactly one of skillId or skillName')
    );
  }

  if (hasId && !UUID_PATTERN.test(skillId)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid skillId'));
  }

  if (hasName && !isNonEmptyTrimmedString(skillName, 255)) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'skillName must be a non-empty string of at most 255 characters')
    );
  }

  next();
}

function validateSkillListQuery(req, res, next) {
  const { search } = req.query;

  if (search !== undefined && typeof search !== 'string') {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid search'));
  }

  validatePaginationQuery(req, res, next);
}

// Shared by any collection endpoint (skills, experiences, ...).
// Applies safe defaults/max, normalizes page/limit to numbers, and
// stores them on req.validatedQuery so downstream code never re-parses
// strings. See the comment in validateUserEmailQuery above for why
// this can't be written back onto req.query itself in Express 5.
function validatePaginationQuery(req, res, next) {
  let { page, limit } = req.query;

  page = page === undefined ? 1 : Number(page);
  limit = limit === undefined ? 20 : Number(limit);

  if (!Number.isInteger(page) || page < 1) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'page must be a positive integer'));
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'limit must be an integer between 1 and 100'));
  }

  req.validatedQuery = { ...req.validatedQuery, page, limit };
  next();
}

// --- Experiences ----------------------------------------------------

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function validateCreateExperience(req, res, next) {
  const { title, company, startDate, endDate, description, skillNames } = req.body || {};

  if (!isNonEmptyTrimmedString(title, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'title is required (max 255 characters)'));
  }

  if (company !== undefined && company !== null && !isNonEmptyTrimmedString(company, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'company must be a non-empty string of at most 255 characters, or null'));
  }

  if (!isValidDateString(startDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'startDate is required and must be an ISO date (YYYY-MM-DD)'));
  }

  if (endDate !== undefined && endDate !== null && !isValidDateString(endDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'endDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return next(new AppError(400, 'VALIDATION_ERROR', 'description must be a string or null'));
  }

  if (skillNames !== undefined) {
    if (
      !Array.isArray(skillNames) ||
      skillNames.length > 50 ||
      !skillNames.every((name) => isNonEmptyTrimmedString(name, 255))
    ) {
      return next(
        new AppError(400, 'VALIDATION_ERROR', 'skillNames must be an array of up to 50 non-empty strings')
      );
    }
  }

  next();
}

function validateUpdateExperience(req, res, next) {
  const { title, company, startDate, endDate, description } = req.body || {};

  if (title !== undefined && !isNonEmptyTrimmedString(title, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'title must be a non-empty string of at most 255 characters'));
  }

  if (company !== undefined && company !== null && !isNonEmptyTrimmedString(company, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'company must be a non-empty string of at most 255 characters, or null'));
  }

  if (startDate !== undefined && !isValidDateString(startDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'startDate must be an ISO date (YYYY-MM-DD)'));
  }

  if (endDate !== undefined && endDate !== null && !isValidDateString(endDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'endDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return next(new AppError(400, 'VALIDATION_ERROR', 'description must be a string or null'));
  }

  next();
}

// --- Education --------------------------------------------------------

function validateCreateEducation(req, res, next) {
  const { degree, institution, startDate, endDate, description } = req.body || {};

  if (
    (degree === undefined || degree === null) &&
    (institution === undefined || institution === null)
  ) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'At least one of degree or institution is required'));
  }

  if (degree !== undefined && degree !== null && !isNonEmptyTrimmedString(degree, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'degree must be a non-empty string of at most 255 characters, or null'));
  }

  if (institution !== undefined && institution !== null && !isNonEmptyTrimmedString(institution, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'institution must be a non-empty string of at most 255 characters, or null'));
  }

  if (startDate !== undefined && startDate !== null && !isValidDateString(startDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'startDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (endDate !== undefined && endDate !== null && !isValidDateString(endDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'endDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return next(new AppError(400, 'VALIDATION_ERROR', 'description must be a string or null'));
  }

  next();
}

function validateUpdateEducation(req, res, next) {
  const { degree, institution, startDate, endDate, description } = req.body || {};

  if (degree !== undefined && degree !== null && !isNonEmptyTrimmedString(degree, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'degree must be a non-empty string of at most 255 characters, or null'));
  }

  if (institution !== undefined && institution !== null && !isNonEmptyTrimmedString(institution, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'institution must be a non-empty string of at most 255 characters, or null'));
  }

  if (startDate !== undefined && startDate !== null && !isValidDateString(startDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'startDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (endDate !== undefined && endDate !== null && !isValidDateString(endDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'endDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return next(new AppError(400, 'VALIDATION_ERROR', 'description must be a string or null'));
  }

  next();
}

function validateEducationIdParam(req, res, next) {
  validateUuidParam('educationId')(req, res, next);
}

// --- Certifications -----------------------------------------------------

function validateCertificationIdParam(req, res, next) {
  validateUuidParam('certificationId')(req, res, next);
}

function validateCreateCertification(req, res, next) {
  const { name, issuingOrganization, issueDate, expirationDate, credentialId } = req.body || {};

  if (!isNonEmptyTrimmedString(name, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'name is required (max 255 characters)'));
  }

  if (
    issuingOrganization !== undefined &&
    issuingOrganization !== null &&
    !isNonEmptyTrimmedString(issuingOrganization, 255)
  ) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'issuingOrganization must be a non-empty string of at most 255 characters, or null')
    );
  }

  if (issueDate !== undefined && issueDate !== null && !isValidDateString(issueDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'issueDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (expirationDate !== undefined && expirationDate !== null && !isValidDateString(expirationDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'expirationDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (
    credentialId !== undefined &&
    credentialId !== null &&
    !isNonEmptyTrimmedString(credentialId, 255)
  ) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'credentialId must be a non-empty string of at most 255 characters, or null')
    );
  }

  next();
}

function validateUpdateCertification(req, res, next) {
  const { name, issuingOrganization, issueDate, expirationDate, credentialId } = req.body || {};

  if (name !== undefined && !isNonEmptyTrimmedString(name, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'name must be a non-empty string of at most 255 characters'));
  }

  if (
    issuingOrganization !== undefined &&
    issuingOrganization !== null &&
    !isNonEmptyTrimmedString(issuingOrganization, 255)
  ) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'issuingOrganization must be a non-empty string of at most 255 characters, or null')
    );
  }

  if (issueDate !== undefined && issueDate !== null && !isValidDateString(issueDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'issueDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (expirationDate !== undefined && expirationDate !== null && !isValidDateString(expirationDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'expirationDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (
    credentialId !== undefined &&
    credentialId !== null &&
    !isNonEmptyTrimmedString(credentialId, 255)
  ) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'credentialId must be a non-empty string of at most 255 characters, or null')
    );
  }

  next();
}

// --- Projects ------------------------------------------------------------

const MAX_URL_LENGTH = 2048;

function isValidProjectUrl(value) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > MAX_URL_LENGTH) {
    return false;
  }
  try {
    // Real (if permissive) URL validation rather than just "is a string" -
    // catches obviously malformed values like "not a url" while still
    // accepting anything a browser would accept as an absolute URL.
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validateProjectIdParam(req, res, next) {
  validateUuidParam('projectId')(req, res, next);
}

function validateCreateProject(req, res, next) {
  const { title, description, startDate, endDate, url, skillNames } = req.body || {};

  if (!isNonEmptyTrimmedString(title, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'title is required (max 255 characters)'));
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return next(new AppError(400, 'VALIDATION_ERROR', 'description must be a string or null'));
  }

  if (startDate !== undefined && startDate !== null && !isValidDateString(startDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'startDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (endDate !== undefined && endDate !== null && !isValidDateString(endDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'endDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (url !== undefined && url !== null && !isValidProjectUrl(url)) {
    return next(new AppError(400, 'VALIDATION_ERROR', `url must be a valid absolute URL of at most ${MAX_URL_LENGTH} characters`));
  }

  if (skillNames !== undefined) {
    if (
      !Array.isArray(skillNames) ||
      skillNames.length > 50 ||
      !skillNames.every((name) => isNonEmptyTrimmedString(name, 255))
    ) {
      return next(
        new AppError(400, 'VALIDATION_ERROR', 'skillNames must be an array of up to 50 non-empty strings')
      );
    }
  }

  next();
}

function validateUpdateProject(req, res, next) {
  const { title, description, startDate, endDate, url } = req.body || {};

  if (title !== undefined && !isNonEmptyTrimmedString(title, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'title must be a non-empty string of at most 255 characters'));
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return next(new AppError(400, 'VALIDATION_ERROR', 'description must be a string or null'));
  }

  if (startDate !== undefined && startDate !== null && !isValidDateString(startDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'startDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (endDate !== undefined && endDate !== null && !isValidDateString(endDate)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'endDate must be an ISO date (YYYY-MM-DD) or null'));
  }

  if (url !== undefined && url !== null && !isValidProjectUrl(url)) {
    return next(new AppError(400, 'VALIDATION_ERROR', `url must be a valid absolute URL of at most ${MAX_URL_LENGTH} characters`));
  }

  next();
}

// --- Career Targets -------------------------------------------------

function validateCareerTargetIdParam(req, res, next) {
  validateUuidParam('careerTargetId')(req, res, next);
}

function validateCreateCareerTarget(req, res, next) {
  const { targetRole, targetIndustry, targetLevel, targetRegion, timeframe, additionalNotes } =
    req.body || {};

  if (!isNonEmptyTrimmedString(targetRole, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'targetRole is required (max 255 characters)'));
  }

  for (const [key, value] of Object.entries({ targetIndustry, targetLevel, targetRegion, timeframe })) {
    if (value === undefined || value === null) continue;
    if (!isNonEmptyTrimmedString(value, 255)) {
      return next(
        new AppError(400, 'VALIDATION_ERROR', `${key} must be a non-empty string of at most 255 characters, or null`)
      );
    }
  }

  if (additionalNotes !== undefined && additionalNotes !== null && typeof additionalNotes !== 'string') {
    return next(new AppError(400, 'VALIDATION_ERROR', 'additionalNotes must be a string or null'));
  }

  next();
}

function validateUpdateCareerTarget(req, res, next) {
  const { targetRole, targetIndustry, targetLevel, targetRegion, timeframe, additionalNotes } =
    req.body || {};

  if (targetRole !== undefined && !isNonEmptyTrimmedString(targetRole, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'targetRole must be a non-empty string of at most 255 characters'));
  }

  for (const [key, value] of Object.entries({ targetIndustry, targetLevel, targetRegion, timeframe })) {
    if (value === undefined || value === null) continue;
    if (!isNonEmptyTrimmedString(value, 255)) {
      return next(
        new AppError(400, 'VALIDATION_ERROR', `${key} must be a non-empty string of at most 255 characters, or null`)
      );
    }
  }

  if (additionalNotes !== undefined && additionalNotes !== null && typeof additionalNotes !== 'string') {
    return next(new AppError(400, 'VALIDATION_ERROR', 'additionalNotes must be a string or null'));
  }

  next();
}

const IMPORTANCE_LEVEL_MIN = 1;
const IMPORTANCE_LEVEL_MAX = 5;

function validateAddTargetSkill(req, res, next) {
  const { skillId, skillName, importanceLevel } = req.body || {};

  const hasId = skillId !== undefined;
  const hasName = skillName !== undefined;

  if (hasId === hasName) {
    // both provided or neither provided
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'Provide exactly one of skillId or skillName')
    );
  }

  if (hasId && !UUID_PATTERN.test(skillId)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid skillId'));
  }

  if (hasName && !isNonEmptyTrimmedString(skillName, 255)) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', 'skillName must be a non-empty string of at most 255 characters')
    );
  }

  if (
    importanceLevel !== undefined &&
    (!Number.isInteger(importanceLevel) ||
      importanceLevel < IMPORTANCE_LEVEL_MIN ||
      importanceLevel > IMPORTANCE_LEVEL_MAX)
  ) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', `importanceLevel must be an integer between ${IMPORTANCE_LEVEL_MIN} and ${IMPORTANCE_LEVEL_MAX}`)
    );
  }

  next();
}

// --- Documents ----------------------------------------------------------
//
// Metadata only - see document.service.js for why. object_key,
// mime_type, file_size_bytes and checksum are set once at creation
// (they describe bytes that already exist somewhere else); only
// file_name and document_type are ever editable afterward.

const CHECKSUM_SHA256_PATTERN = /^[0-9a-f]{64}$/;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB - a sane upper bound for resumes/cover letters

function validateDocumentIdParam(req, res, next) {
  validateUuidParam('documentId')(req, res, next);
}

function validateCreateDocument(req, res, next) {
  const { fileName, objectKey, mimeType, fileSizeBytes, checksumSha256, documentType, parentDocumentId } =
    req.body || {};

  if (!isNonEmptyTrimmedString(fileName, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'fileName is required (max 255 characters)'));
  }

  if (!isNonEmptyTrimmedString(objectKey, 1024)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'objectKey is required (max 1024 characters)'));
  }

  if (!isNonEmptyTrimmedString(mimeType, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'mimeType is required (max 255 characters)'));
  }

  if (
    !Number.isInteger(fileSizeBytes) ||
    fileSizeBytes < 0 ||
    fileSizeBytes > MAX_FILE_SIZE_BYTES
  ) {
    return next(
      new AppError(400, 'VALIDATION_ERROR', `fileSizeBytes must be a non-negative integer up to ${MAX_FILE_SIZE_BYTES}`)
    );
  }

  if (checksumSha256 !== undefined && checksumSha256 !== null && !CHECKSUM_SHA256_PATTERN.test(checksumSha256)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'checksumSha256 must be 64 lowercase hex characters'));
  }

  if (documentType !== undefined && documentType !== null && !isNonEmptyTrimmedString(documentType, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'documentType must be a non-empty string of at most 255 characters, or null'));
  }

  if (parentDocumentId !== undefined && parentDocumentId !== null && !UUID_PATTERN.test(parentDocumentId)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid parentDocumentId'));
  }

  next();
}

function validateUpdateDocument(req, res, next) {
  const { fileName, documentType } = req.body || {};

  if (fileName !== undefined && !isNonEmptyTrimmedString(fileName, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'fileName must be a non-empty string of at most 255 characters'));
  }

  if (documentType !== undefined && documentType !== null && !isNonEmptyTrimmedString(documentType, 255)) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'documentType must be a non-empty string of at most 255 characters, or null'));
  }

  next();
}

module.exports = {
  validateUserEmailQuery,
  validateRegistration,
  validateLogin,
  validateProfileFields,
  validateSkillIdParam,
  validateAddSkill,
  validateSkillListQuery,
  validatePaginationQuery,
  validateExperienceIdParam,
  validateCreateExperience,
  validateUpdateExperience,
  validateEducationIdParam,
  validateCreateEducation,
  validateUpdateEducation,
  validateCertificationIdParam,
  validateCreateCertification,
  validateUpdateCertification,
  validateCareerTargetIdParam,
  validateCreateCareerTarget,
  validateUpdateCareerTarget,
  validateAddTargetSkill,
  validateDocumentIdParam,
  validateCreateDocument,
  validateUpdateDocument,
  validateProjectIdParam,
  validateCreateProject,
  validateUpdateProject,
};
