const { withTransaction } = require('../config/database');
const documentRepository = require('../repositories/document.repository');
const profileService = require('./profile.service');
const { storageProvider } = require('../storage');
const { DefaultDocumentProcessor } = require('../processors/document.processor');
const { validateUploadedFile } = require('./document-validation.service');
const AppError = require('../errors/app-error');

const documentProcessor = new DefaultDocumentProcessor();

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
  if (!row) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  return toPublicDocument(row);
}

async function createDocument(userId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const { parentDocumentId } = fields;

  return withTransaction(async (client) => {
    let versionNumber = 1;
    if (parentDocumentId) {
      const parent = await documentRepository.findOwnedForUpdate(parentDocumentId, profileId, client);
      if (!parent) throw new AppError(404, 'PARENT_DOCUMENT_NOT_FOUND', 'Parent document not found');
      versionNumber = parent.version_number + 1;
    }
    const created = await documentRepository.create(profileId, { ...fields, versionNumber }, client);
    return toPublicDocument(created);
  });
}

async function uploadDocument(userId, { buffer, fileName, mimeType, checksumSha256, documentType, parentDocumentId }) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const validated = await validateUploadedFile({ buffer, fileName, mimeType });

  if (checksumSha256 !== undefined && checksumSha256 !== null && checksumSha256 !== validated.checksumSha256) {
    throw new AppError(400, 'CHECKSUM_MISMATCH', 'Provided checksum does not match file contents');
  }

  let stored;
  try {
    stored = await storageProvider.store(buffer, { extension: validated.extension });
  } catch (err) {
    throw new AppError(500, 'STORAGE_ERROR', 'Document storage failed');
  }

  let document;
  try {
    document = await withTransaction(async (client) => {
      let versionNumber = 1;
      if (parentDocumentId) {
        const parent = await documentRepository.findOwnedForUpdate(parentDocumentId, profileId, client);
        if (!parent) throw new AppError(404, 'PARENT_DOCUMENT_NOT_FOUND', 'Parent document not found');
        versionNumber = parent.version_number + 1;
      }
      return documentRepository.create(profileId, {
        fileName: validated.fileName,
        objectKey: stored.objectKey,
        mimeType: validated.mimeType,
        fileSizeBytes: validated.fileSizeBytes,
        checksumSha256: validated.checksumSha256,
        documentType,
        parentDocumentId,
        versionNumber,
      }, client);
    });
  } catch (err) {
    await storageProvider.delete(stored.objectKey).catch(() => {});
    throw err;
  }

  try {
    const processed = await documentProcessor.process(buffer, validated.mimeType, validated.extension);
    const updated = await documentRepository.updateProcessing(document.document_id, profileId, {
      scanStatus: 'clean',
      rawText: processed.rawText,
      parseabilityScore: processed.parseabilityScore,
    });
    if (!updated) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    return toPublicDocument(updated);
  } catch (err) {
    try {
      const failed = await documentRepository.updateProcessing(document.document_id, profileId, {
        scanStatus: 'failed',
        rawText: null,
        parseabilityScore: null,
      });
      if (failed) return toPublicDocument(failed);
    } catch (persistErr) {
      console.error('Failed to persist document processing failure:', persistErr.message);
    }
    if (err instanceof AppError) throw err;
    throw new AppError(422, 'DOCUMENT_PROCESSING_FAILED', 'Document processing failed');
  }
}

async function updateDocument(userId, documentId, fields) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  const existing = await documentRepository.findOwned(documentId, profileId);
  if (!existing) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  const updated = await documentRepository.updateOwned(documentId, profileId, fields);
  return toPublicDocument(updated);
}

async function deleteDocument(userId, documentId) {
  const profileId = await profileService.requireOwnedProfileId(userId);
  try {
    const deleted = await documentRepository.deleteOwned(documentId, profileId);
    if (!deleted) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    try {
      await storageProvider.delete(deleted.object_key);
    } catch (storageErr) {
      console.error('Stored document could not be removed:', storageErr.message);
    }
  } catch (err) {
    if (err.code === '23503') {
      throw new AppError(409, 'DOCUMENT_HAS_NEWER_VERSIONS', 'Cannot delete a document that is the parent of a newer version');
    }
    throw err;
  }
}

module.exports = {
  listDocuments,
  getDocument,
  createDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
};
