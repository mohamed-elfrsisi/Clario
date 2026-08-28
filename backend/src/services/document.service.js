// src/services/document.service.js
//
// IMPORTANT SCOPE NOTE: there is no object storage integration in this
// backend (no S3/GCS/filesystem upload code exists anywhere in the
// project). This service only ever persists/retrieves document
// METADATA. It does not upload, download, scan, or extract text from
// anything - `rawText`, `scanStatus`, and `parseabilityScore` are
// processing-pipeline outputs that don't exist yet, so they are never
// settable through this API and always come back null/'pending' until
// that pipeline is built.

const { withTransaction } = require('../config/database');
const documentRepository = require('../repositories/document.repository');
const profileService = require('./profile.service');
const AppError = require('../errors/app-error');

function toPublicDocument(row) {
  return {
    documentId: row.document_id,
    profileId: row.profile_id,
    fileName: row.file_name,
    objectKey: row.object_key,
    mimeType: row.mime_type,
    fileSizeBytes: Number(row.file_size_bytes),
    checksumSha256: row.checksum_sha256,
    documentType: row.document_type,
    rawText: row.raw_text,
    scanStatus: row.scan_status,
    parseabilityScore: row.parseability_score === null ? null : Number(row.parseability_score),
    versionNumber: row.version_number,
    parentDocumentId: row.parent_document_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listDocuments(userId, { page, limit }) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const offset = (page - 1) * limit;
  const rows = await documentRepository.listForProfile(profileId, { limit, offset });
  return rows.map(toPublicDocument);
}

async function getDocument(userId, documentId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const row = await documentRepository.findOwned(documentId, profileId);

  if (!row) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  return toPublicDocument(row);
}

// parentDocumentId, when provided, must be a document already owned
// by this caller - never trusted blindly - and the new row's
// version_number is computed server-side as parent + 1, never taken
// from the client. Locking the parent row (FOR UPDATE, inside a
// transaction) prevents two concurrent "new version" requests from
// both computing the same next version number.
async function createDocument(userId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const { parentDocumentId } = fields;

  return withTransaction(async (client) => {
    let versionNumber = 1;

    if (parentDocumentId) {
      const parent = await documentRepository.findOwnedForUpdate(parentDocumentId, profileId, client);
      if (!parent) {
        throw new AppError(404, 'PARENT_DOCUMENT_NOT_FOUND', 'Parent document not found');
      }
      versionNumber = parent.version_number + 1;
    }

    const created = await documentRepository.create(profileId, { ...fields, versionNumber }, client);
    return toPublicDocument(created);
  });
}

async function updateDocument(userId, documentId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  const existing = await documentRepository.findOwned(documentId, profileId);
  if (!existing) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  const updated = await documentRepository.updateOwned(documentId, profileId, fields);
  return toPublicDocument(updated);
}

async function deleteDocument(userId, documentId) {
  const profileId = await profileService.requireOwnedProfileId(userId);

  try {
    const deleted = await documentRepository.deleteOwned(documentId, profileId);
    if (!deleted) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    }
  } catch (err) {
    // 23503 = foreign_key_violation. The only FK that can block a
    // document delete is a newer version's parent_document_id still
    // pointing at it (ON DELETE RESTRICT, by design - see the
    // migration comment). Report that plainly instead of a raw
    // constraint-name error.
    if (err.code === '23503') {
      throw new AppError(
        409,
        'DOCUMENT_HAS_NEWER_VERSIONS',
        'Cannot delete a document that is the parent of a newer version'
      );
    }
    throw err;
  }
}

module.exports = {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
};
