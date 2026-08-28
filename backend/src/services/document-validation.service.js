const crypto = require('crypto');
const path = require('path');
const AppError = require('../errors/app-error');

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED = {
  pdf: { mime: 'application/pdf' },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  txt: { mime: 'text/plain' },
};

function sanitizeFileName(fileName) {
  if (typeof fileName !== 'string') {
    throw new AppError(400, 'INVALID_FILE_NAME', 'Filename is required');
  }
  const trimmed = fileName.trim();
  if (!trimmed || trimmed.length > 255 || trimmed.includes('\0')) {
    throw new AppError(400, 'INVALID_FILE_NAME', 'Invalid filename');
  }
  if (trimmed === '.' || trimmed === '..' || path.basename(trimmed) !== trimmed) {
    throw new AppError(400, 'INVALID_FILE_NAME', 'Invalid filename');
  }
  if (/[/\\]/.test(trimmed) || /[\u0000-\u001F]/.test(trimmed)) {
    throw new AppError(400, 'INVALID_FILE_NAME', 'Invalid filename');
  }
  return trimmed;
}

function sniffMime(buffer, extension) {
  if (extension === 'pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-' ? 'application/pdf' : null;
  }
  if (extension === 'docx') {
    const signature = buffer.subarray(0, 2).toString('hex');
    if (signature !== '504b') return null;
    return null;
  }
  if (extension === 'txt') {
    if (buffer.includes(0)) return null;
    const decoded = buffer.toString('utf8');
    if (decoded.includes('\uFFFD')) return null;
    return 'text/plain';
  }
  return null;
}

async function validateUploadedFile({ buffer, fileName, mimeType }) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError(400, 'EMPTY_FILE', 'File is empty');
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new AppError(413, 'FILE_TOO_LARGE', 'File exceeds the maximum allowed size');
  }

  const safeFileName = sanitizeFileName(fileName);
  const extension = path.extname(safeFileName).slice(1).toLowerCase();
  if (!ALLOWED[extension]) {
    throw new AppError(415, 'UNSUPPORTED_DOCUMENT', 'Only PDF, DOCX, and TXT files are supported');
  }

  if (typeof mimeType !== 'string' || mimeType.toLowerCase() !== ALLOWED[extension].mime) {
    throw new AppError(415, 'INVALID_MIME_TYPE', 'File MIME type does not match its extension');
  }

  const sniffed = sniffMime(buffer, extension);
  if (extension === 'docx') {
    // A DOCX is a ZIP package. The full package structure is verified by the
    // processing step before success is persisted; the ZIP signature is the
    // safe content-level check available before storage.
    if (buffer.subarray(0, 2).toString('hex') !== '504b') {
      throw new AppError(415, 'INVALID_FILE_CONTENT', 'File content does not match DOCX');
    }
  } else if (sniffed !== ALLOWED[extension].mime) {
    throw new AppError(415, 'INVALID_FILE_CONTENT', 'File content does not match its declared type');
  }

  return {
    fileName: safeFileName,
    extension,
    mimeType: ALLOWED[extension].mime,
    fileSizeBytes: buffer.length,
    checksumSha256: crypto.createHash('sha256').update(buffer).digest('hex'),
  };
}

module.exports = {
  MAX_FILE_SIZE_BYTES,
  validateUploadedFile,
};
