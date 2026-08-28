// src/repositories/certification.repository.js
//
// Every function accepts an optional `executor` (defaults to the
// shared pool), matching the pattern used elsewhere for callers that
// need to run inside a transaction.

const { pool } = require('../config/database');

async function listForProfile(profileId, { limit, offset }, executor = pool) {
  const query = `
    SELECT certification_id, profile_id, name, issuing_organization, issue_date,
           expiration_date, credential_id, created_at, updated_at
    FROM certifications
    WHERE profile_id = $1
    ORDER BY issue_date DESC NULLS LAST, created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await executor.query(query, [profileId, limit, offset]);
  return result.rows;
}

// Returns the row ONLY if it belongs to profileId - the ownership
// check every read/update/delete relies on.
async function findOwned(certificationId, profileId, executor = pool) {
  const query = `
    SELECT certification_id, profile_id, name, issuing_organization, issue_date,
           expiration_date, credential_id, created_at, updated_at
    FROM certifications
    WHERE certification_id = $1 AND profile_id = $2
  `;

  const result = await executor.query(query, [certificationId, profileId]);
  return result.rows[0] || null;
}

async function create(
  profileId,
  { name, issuingOrganization, issueDate, expirationDate, credentialId },
  executor = pool
) {
  const query = `
    INSERT INTO certifications (profile_id, name, issuing_organization, issue_date,
                                 expiration_date, credential_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING certification_id, profile_id, name, issuing_organization, issue_date,
              expiration_date, credential_id, created_at, updated_at
  `;

  const result = await executor.query(query, [
    profileId,
    name,
    issuingOrganization ?? null,
    issueDate ?? null,
    expirationDate ?? null,
    credentialId ?? null,
  ]);

  return result.rows[0];
}

async function updateOwned(certificationId, profileId, fields, executor = pool) {
  const { name, issuingOrganization, issueDate, expirationDate, credentialId } = fields;

  // issue_date and expiration_date are both nullable columns, so (like
  // educations.start_date/end_date) COALESCE can't tell "field omitted"
  // apart from "field explicitly set to null". Both get an explicit
  // "was this key present in the request?" flag.
  const issueDateProvided = issueDate !== undefined;
  const expirationDateProvided = expirationDate !== undefined;

  const query = `
    UPDATE certifications
    SET name = COALESCE($3, name),
        issuing_organization = COALESCE($4, issuing_organization),
        issue_date = CASE WHEN $5 THEN $6 ELSE issue_date END,
        expiration_date = CASE WHEN $7 THEN $8 ELSE expiration_date END,
        credential_id = COALESCE($9, credential_id),
        updated_at = clock_timestamp()
    WHERE certification_id = $1 AND profile_id = $2
    RETURNING certification_id, profile_id, name, issuing_organization, issue_date,
              expiration_date, credential_id, created_at, updated_at
  `;

  const result = await executor.query(query, [
    certificationId,
    profileId,
    name ?? null,
    issuingOrganization ?? null,
    issueDateProvided,
    issueDateProvided ? issueDate : null,
    expirationDateProvided,
    expirationDateProvided ? expirationDate : null,
    credentialId ?? null,
  ]);

  return result.rows[0] || null;
}

async function deleteOwned(certificationId, profileId, executor = pool) {
  const query = `
    DELETE FROM certifications
    WHERE certification_id = $1 AND profile_id = $2
    RETURNING certification_id
  `;

  const result = await executor.query(query, [certificationId, profileId]);
  return result.rows.length > 0;
}

module.exports = {
  listForProfile,
  findOwned,
  create,
  updateOwned,
  deleteOwned,
};
