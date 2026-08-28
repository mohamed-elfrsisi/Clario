const { pool } = require('../config/database');

const DOCUMENT_COLUMNS = `
  document_id, profile_id, file_name, object_key, mime_type,
  file_size_bytes, checksum_sha256, document_type, raw_text,
  scan_status, parseability_score, version_number,
  parent_document_id, created_at, updated_at
`;

async function listForProfile(profileId, { limit, offset }, executor = pool) {
  const result = await executor.query(
    `SELECT ${DOCUMENT_COLUMNS} FROM documents WHERE profile_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [profileId, limit, offset]
  );
  return result.rows;
}

async function findOwned(documentId, profileId, executor = pool) {
  const result = await executor.query(
    `SELECT ${DOCUMENT_COLUMNS} FROM documents WHERE document_id = $1 AND profile_id = $2`,
    [documentId, profileId]
  );
  return result.rows[0] || null;
}

async function findOwnedForUpdate(documentId, profileId, executor) {
  const result = await executor.query(
    `SELECT document_id, profile_id, version_number, object_key FROM documents WHERE document_id = $1 AND profile_id = $2 FOR UPDATE`,
    [documentId, profileId]
  );
  return result.rows[0] || null;
}

async function create(
  profileId,
  { fileName, objectKey, mimeType, fileSizeBytes, checksumSha256, documentType, parentDocumentId, versionNumber },
  executor = pool
) {
  const result = await executor.query(
    `INSERT INTO documents (
       profile_id, file_name, object_key, mime_type, file_size_bytes,
       checksum_sha256, document_type, parent_document_id, version_number
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING ${DOCUMENT_COLUMNS}`,
    [
      profileId,
      fileName,
      objectKey,
      mimeType,
      fileSizeBytes,
      checksumSha256 ?? null,
      documentType ?? null,
      parentDocumentId ?? null,
      versionNumber ?? 1,
    ]
  );
  return result.rows[0];
}

async function updateOwned(documentId, profileId, { fileName, documentType }, executor = pool) {
  const result = await executor.query(
    `UPDATE documents
       SET file_name = COALESCE($3, file_name),
           document_type = CASE WHEN $4::text IS NULL THEN document_type ELSE $4 END,
           updated_at = clock_timestamp()
     WHERE document_id = $1 AND profile_id = $2
     RETURNING ${DOCUMENT_COLUMNS}`,
    [documentId, profileId, fileName ?? null, documentType ?? null]
  );
  return result.rows[0] || null;
}

async function updateProcessing(documentId, profileId, { scanStatus, rawText, parseabilityScore }, executor = pool) {
  const result = await executor.query(
    `UPDATE documents
       SET scan_status = $3,
           raw_text = $4,
           parseability_score = $5,
           updated_at = clock_timestamp()
     WHERE document_id = $1 AND profile_id = $2
     RETURNING ${DOCUMENT_COLUMNS}`,
    [documentId, profileId, scanStatus, rawText ?? null, parseabilityScore ?? null]
  );
  return result.rows[0] || null;
}

async function deleteOwned(documentId, profileId, executor = pool) {
  const result = await executor.query(
    `DELETE FROM documents WHERE document_id = $1 AND profile_id = $2 RETURNING document_id, object_key`,
    [documentId, profileId]
  );
  return result.rows[0] || null;
}

module.exports = {
  listForProfile,
  findOwned,
  findOwnedForUpdate,
  create,
  updateOwned,
  updateProcessing,
  deleteOwned,
};
