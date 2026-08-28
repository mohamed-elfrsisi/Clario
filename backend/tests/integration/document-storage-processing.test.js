const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/database');
const { uniqueTestEmail } = require('../helpers/uniqueEmail');
const { storageProvider } = require('../../src/storage');

async function registerLoginAndCreateProfile() {
  const email = uniqueTestEmail();
  const password = 'correct-horse-battery';
  await request(app).post('/api/auth/register').send({ email, password });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  const cookie = login.headers['set-cookie'];
  await request(app).post('/api/profiles').set('Cookie', cookie).send({ fullName: 'Storage Tester' });
  return { cookie, email };
}

afterAll(async () => {
  await pool.query("DELETE FROM documents WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))");
  await pool.query("DELETE FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test')");
  await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
  await pool.end();
});

describe('POST /api/documents/upload', () => {
  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Content-Type', 'text/plain')
      .set('X-File-Name', 'resume.txt')
      .send(Buffer.from('resume text'));
    expect(res.status).toBe(401);
  });

  test('stores and processes TXT with a server-generated object key', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const body = Buffer.from('Mohamed Elfarsisi\nSoftware Engineer');
    const checksum = require('crypto').createHash('sha256').update(body).digest('hex');
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', cookie)
      .set('Content-Type', 'text/plain')
      .set('X-File-Name', 'resume.txt')
      .set('X-Checksum-Sha256', checksum)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.document.scanStatus).toBe('clean');
    expect(res.body.document.rawText).toContain('Software Engineer');
    expect(res.body.document.objectKey).toMatch(/^[0-9a-f-]{36}\.txt$/);
    expect(await storageProvider.exists(res.body.document.objectKey)).toBe(true);
  });

  test('rejects checksum mismatch before storage', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', cookie)
      .set('Content-Type', 'text/plain')
      .set('X-File-Name', 'resume.txt')
      .set('X-Checksum-Sha256', '0'.repeat(64))
      .send(Buffer.from('resume text'));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CHECKSUM_MISMATCH');
  });

  test('rejects path traversal and executable extensions', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const traversal = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', cookie)
      .set('Content-Type', 'text/plain')
      .set('X-File-Name', '../resume.txt')
      .send(Buffer.from('resume text'));
    expect(traversal.status).toBe(400);

    const executable = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', cookie)
      .set('Content-Type', 'application/octet-stream')
      .set('X-File-Name', 'resume.exe')
      .send(Buffer.from('MZ'));
    expect(executable.status).toBe(415);
  });

  test('does not allow another user to version another user\'s document', async () => {
    const userA = await registerLoginAndCreateProfile();
    const userB = await registerLoginAndCreateProfile();
    const created = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', userA.cookie)
      .set('Content-Type', 'text/plain')
      .set('X-File-Name', 'resume.txt')
      .send(Buffer.from('owner A'));
    const parentId = created.body.document.documentId;

    const res = await request(app)
      .post('/api/documents/upload')
      .set('Cookie', userB.cookie)
      .set('Content-Type', 'text/plain')
      .set('X-File-Name', 'resume.txt')
      .set('X-Parent-Document-Id', parentId)
      .send(Buffer.from('owner B'));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PARENT_DOCUMENT_NOT_FOUND');
  });
});
