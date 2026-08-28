// src/repositories/document.repository.js
//
// This backend has no object storage integration yet - there is no
// S3/GCS/filesystem upload code anywhere in the project. This layer
// therefore only ever reads/writes document METADATA rows. object_key
// is treated as an opaque string the client already obtained from
// wherever the file bytes actually live; nothing here uploads,
// downloads, or touches file content.

const { pool } = require('../config/database');

async function listForProfile(profileId, { limit, offset }, executor = pool) {
  const query = `
    SELECT document_id, profile_id, file_name, object_key, mime_type,
           file_size_bytes, checksum_sha256, document_type, raw_text,
           scan_status, parseability_score, version_number,
           parent_document_id, created_at, updated_at
    FROM documents
    WHERE profile_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await executor.query(query, [profileId, limit, offset]);
  return result.rows;
}

// Returns the row ONLY if it belongs to profileId - the ownership
// check every read/update/delete relies on.
async function findOwned(documentId, profileId, executor = pool) {
  const query = `
    SELECT document_id, profile_id, file_name, object_key, mime_type,
           file_size_bytes, checksum_sha256, document_type, raw_text,
           scan_status, parseability_score, version_number,
           parent_document_id, created_at, updated_at
    FROM documents
    WHERE document_id = $1 AND profile_id = $2
  `;

  const result = await executor.query(query, [documentId, profileId]);
  return result.rows[0] || null;
}

// FOR UPDATE locks the parent row for the duration of the enclosing
// transaction so two concurrent "create a new version of this
// document" requests can't both read the same version_number and
// each insert a sibling claiming to be version_number + 1.
async function findOwnedForUpdate(documentId, profileId, executor) {
  const query = `
    SELECT document_id, profile_id, version_number
    FROM documents
    WHERE document_id = $1 AND profile_id = $2
    FOR UPDATE
  `;

  const result = await executor.query(query, [documentId, profileId]);
  return result.rows[0] || null;
}

async function create(
  profileId,
  { fileName, objectKey, mimeType, fileSizeBytes, checksumSha256, documentType, parentDocumentId, versionNumber },
  executor = pool
) {
  const query = `
    INSERT INTO documents (
      profile_id, file_name, object_key, mime_type, file_size_bytes,
      checksum_sha256, document_type, parent_document_id, version_number
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING document_id, profile_id, file_name, object_key, mime_type,
              file_size_bytes, checksum_sha256, document_type, raw_text,
              scan_status, parseability_score, version_number,
              parent_document_id, created_at, updated_at
  `;

  const result = await executor.query(query, [
    profileId,
    fileName,
    objectKey,
    mimeType,
    fileSizeBytes,
    checksumSha256 ?? null,
    documentType ?? null,
    parentDocumentId ?? null,
    versionNumber ?? 1,
  ]);

  return result.rows[0];
}

// Only file_name and document_type are editable metadata. Everything
// else (object_key, mime_type, checksum, scan_status, raw_text,
// parseability_score, version_number, parent_document_id) is either
// set once at upload time or owned by a processing pipeline that
// doesn't exist yet in this backend - none of it is exposed here.
async function updateOwned(documentId, profileId, { fileName, documentType }, executor = pool) {
  const query = `
    UPDATE documents
    SET file_name = COALESCE($3, file_name),
        document_type = COALESCE($4, document_type),
        updated_at = clock_timestamp()
    WHERE document_id = $1 AND profile_id = $2
    RETURNING document_id, profile_id, file_name, object_key, mime_type,
              file_size_bytes, checksum_sha256, document_type, raw_text,
              scan_status, parseability_score, version_number,
              parent_document_id, created_at, updated_at
  `;

  const result = await executor.query(query, [documentId, profileId, fileName ?? null, documentType ?? null]);
  return result.rows[0] || null;
}

async function deleteOwned(documentId, profileId, executor = pool) {
  const query = `
    DELETE FROM documents
    WHERE document_id = $1 AND profile_id = $2
    RETURNING document_id
  `;

  const result = await executor.query(query, [documentId, profileId]);
  return result.rows.length > 0;
}

module.exports = {
  listForProfile,
  findOwned,
  findOwnedForUpdate,
  create,
  updateOwned,
  deleteOwned,
};
