const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const LocalStorageProvider = require('../../src/storage/local-storage.provider');
const { validateUploadedFile } = require('../../src/services/document-validation.service');
const { DefaultDocumentProcessor } = require('../../src/processors/document.processor');

const execFileAsync = promisify(execFile);

function buildPdf(text) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(`BT /F1 12 Tf 72 720 Td (${text}) Tj ET`)} >>\nstream\nBT /F1 12 Tf 72 720 Td (${text}) Tj ET\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf);
}

async function buildDocx() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'clario-docx-fixture-'));
  const wordDir = path.join(dir, 'word');
  await fs.mkdir(wordDir, { recursive: true });
  await fs.writeFile(path.join(dir, '[Content_Types].xml'), '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>');
  await fs.writeFile(path.join(wordDir, 'document.xml'), '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Clario DOCX test</w:t></w:r></w:p></w:body></w:document>');
  const output = path.join(os.tmpdir(), `clario-${crypto.randomUUID()}.docx`);
  try {
    await execFileAsync('zip', ['-q', '-r', output, '.'], { cwd: dir });
    return await fs.readFile(output);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
    await fs.rm(output, { force: true });
  }
}

describe('document validation and storage', () => {
  test('accepts valid TXT and calculates checksum from bytes', async () => {
    const buffer = Buffer.from('Mohamed Elfarsisi\nSoftware Engineer');
    const result = await validateUploadedFile({ buffer, fileName: 'resume.txt', mimeType: 'text/plain' });
    expect(result.fileSizeBytes).toBe(buffer.length);
    expect(result.checksumSha256).toBe(crypto.createHash('sha256').update(buffer).digest('hex'));
  });

  test.each([
    ['resume.exe', 'application/octet-stream'],
    ['resume.pdf', 'text/plain'],
    ['../resume.txt', 'text/plain'],
    ['resume.txt', 'text/plain'],
  ])('rejects unsafe or invalid upload metadata: %s', async (fileName, mimeType) => {
    const buffer = fileName === 'resume.txt' ? Buffer.from([0]) : Buffer.from('not a pdf');
    await expect(validateUploadedFile({ buffer, fileName, mimeType })).rejects.toBeDefined();
  });

  test('rejects oversized files', async () => {
    const buffer = Buffer.alloc(50 * 1024 * 1024 + 1);
    await expect(validateUploadedFile({ buffer, fileName: 'resume.txt', mimeType: 'text/plain' })).rejects.toMatchObject({ code: 'FILE_TOO_LARGE' });
  });

  test('stores, retrieves, checks, and deletes real local bytes', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'clario-storage-'));
    const storage = new LocalStorageProvider(root);
    const buffer = Buffer.from('stored bytes');
    const { objectKey } = await storage.store(buffer, { extension: 'txt' });
    expect(objectKey).toMatch(/^[0-9a-f-]{36}\.txt$/);
    expect(await storage.exists(objectKey)).toBe(true);
    expect(await storage.retrieve(objectKey)).toEqual(buffer);
    expect(await storage.delete(objectKey)).toBe(true);
    expect(await storage.exists(objectKey)).toBe(false);
    await fs.rm(root, { recursive: true, force: true });
  });

  test('rejects path traversal object keys', async () => {
    const storage = new LocalStorageProvider(os.tmpdir());
    await expect(storage.exists('../secret.txt')).rejects.toMatchObject({ code: 'INVALID_OBJECT_KEY' });
  });
});

describe('document processing', () => {
  const processor = new DefaultDocumentProcessor();

  test('extracts and normalizes TXT', async () => {
    const result = await processor.process(Buffer.from('Hello\r\n\r\nWorld'), 'text/plain', 'txt');
    expect(result.rawText).toBe('Hello\n\nWorld');
    expect(result.parseabilityScore).toBeGreaterThan(0);
  });

  test('extracts PDF text through pdftotext', async () => {
    const result = await processor.process(buildPdf('Clario PDF test'), 'application/pdf', 'pdf');
    expect(result.rawText).toContain('Clario PDF test');
  });

  test('extracts DOCX text through unzip', async () => {
    const buffer = await buildDocx();
    const result = await processor.process(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx');
    expect(result.rawText).toContain('Clario DOCX test');
  });

  test('fails malformed DOCX instead of claiming successful extraction', async () => {
    await expect(processor.process(Buffer.from('PK\x03\x04not-a-docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx')).rejects.toMatchObject({ code: 'DOCUMENT_PROCESSING_FAILED' });
  });

  test('fails malformed PDF instead of claiming successful extraction', async () => {
    await expect(processor.process(Buffer.from('%PDF-not-real'), 'application/pdf', 'pdf')).rejects.toMatchObject({ code: 'DOCUMENT_PROCESSING_FAILED' });
  });

  test('fails empty extracted content', async () => {
    await expect(processor.process(Buffer.from(''), 'text/plain', 'txt')).rejects.toMatchObject({ code: 'DOCUMENT_PROCESSING_FAILED' });
  });
});
