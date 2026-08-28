const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const DocumentProcessor = require('./document-processor');
const AppError = require('../errors/app-error');

const execFileAsync = promisify(execFile);

function normalizeText(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function calculateParseability(text, inputSize) {
  if (!text || inputSize <= 0) return 0;
  const lengthFactor = Math.min(1, text.length / 200);
  const density = Math.min(1, text.length / inputSize * 20);
  return Number((Math.min(1, (lengthFactor * 0.6) + (density * 0.4)) * 100).toFixed(2));
}

function decodeXmlEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

async function withTempFile(buffer, extension, fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'clario-document-'));
  const filePath = path.join(dir, `${crypto.randomUUID()}.${extension}`);
  try {
    await fs.writeFile(filePath, buffer, { mode: 0o600 });
    return await fn(filePath);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

async function extractPdf(buffer) {
  try {
    return await withTempFile(buffer, 'pdf', async (filePath) => {
      const { stdout } = await execFileAsync('pdftotext', ['-enc', 'UTF-8', '-layout', filePath, '-'], {
        timeout: 15000,
        maxBuffer: 20 * 1024 * 1024,
      });
      return stdout;
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new AppError(500, 'PROCESSOR_DEPENDENCY_MISSING', 'PDF processing dependency is unavailable');
    }
    throw new AppError(422, 'DOCUMENT_PROCESSING_FAILED', 'PDF text extraction failed');
  }
}

async function extractDocx(buffer) {
  try {
    return await withTempFile(buffer, 'docx', async (filePath) => {
      await execFileAsync('unzip', ['-t', filePath], { timeout: 10000, maxBuffer: 2 * 1024 * 1024 });
      const { stdout } = await execFileAsync('unzip', ['-p', filePath, 'word/document.xml'], {
        timeout: 10000,
        maxBuffer: 20 * 1024 * 1024,
      });
      if (!stdout || !/<(?:w:)?document\b/i.test(stdout)) {
        throw new Error('document.xml missing');
      }
      const withBreaks = stdout
        .replace(/<w:tab\s*\/?>/gi, '\t')
        .replace(/<w:br\s*\/?>/gi, '\n')
        .replace(/<w:cr\s*\/?>/gi, '\n')
        .replace(/<w:p\b[^>]*>/gi, '\n');
      const text = withBreaks.replace(/<[^>]+>/g, '');
      return decodeXmlEntities(text);
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new AppError(500, 'PROCESSOR_DEPENDENCY_MISSING', 'DOCX processing dependency is unavailable');
    }
    throw new AppError(422, 'DOCUMENT_PROCESSING_FAILED', 'DOCX text extraction failed');
  }
}

class DefaultDocumentProcessor extends DocumentProcessor {
  async process(buffer, mimeType, extension) {
    let rawText;
    if (extension === 'txt' && mimeType === 'text/plain') {
      rawText = buffer.toString('utf8');
      if (rawText.includes('\uFFFD')) {
        throw new AppError(422, 'DOCUMENT_PROCESSING_FAILED', 'TXT text extraction failed');
      }
    } else if (extension === 'pdf' && mimeType === 'application/pdf') {
      rawText = await extractPdf(buffer);
    } else if (
      extension === 'docx' &&
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      rawText = await extractDocx(buffer);
    } else {
      throw new AppError(415, 'UNSUPPORTED_DOCUMENT', 'Unsupported document type');
    }

    const normalizedText = normalizeText(rawText);
    if (!normalizedText) {
      throw new AppError(422, 'DOCUMENT_PROCESSING_FAILED', 'Document contains no extractable text');
    }

    return {
      rawText: normalizedText,
      parseabilityScore: calculateParseability(normalizedText, buffer.length),
    };
  }
}

module.exports = {
  DefaultDocumentProcessor,
  normalizeText,
  calculateParseability,
};
