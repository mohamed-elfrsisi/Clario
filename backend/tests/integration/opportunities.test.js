const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/database');
const { uniqueTestEmail } = require('../helpers/uniqueEmail');

const QA_PREFIX = 'QA Opportunity';
const QA_SKILL_PREFIX = 'QA Opportunity Skill';

function uniqueTitle() {
  return `${QA_PREFIX} ${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function uniqueSkillName() {
  return `${QA_SKILL_PREFIX} ${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function login() {
  const email = uniqueTestEmail();
  const password = 'correct-horse-battery';
  await request(app).post('/api/auth/register').send({ email, password });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return loginRes.headers['set-cookie'];
}

async function createOpportunity(cookie, title = uniqueTitle()) {
  const res = await request(app)
    .post('/api/opportunities')
    .set('Cookie', cookie)
    .send({ title, organization: 'QA Org', roleType: 'Full-time' });
  expect(res.status).toBe(201);
  return res.body.opportunity.opportunityId;
}

async function cleanup() {
  await pool.query(`DELETE FROM opportunity_skills WHERE opportunity_id IN (SELECT opportunity_id FROM opportunities WHERE title LIKE '${QA_PREFIX}%')`);
  await pool.query(`DELETE FROM interviews WHERE opportunity_id IN (SELECT opportunity_id FROM opportunities WHERE title LIKE '${QA_PREFIX}%')`);
  await pool.query(`DELETE FROM analyses WHERE opportunity_id IN (SELECT opportunity_id FROM opportunities WHERE title LIKE '${QA_PREFIX}%')`);
  await pool.query(`DELETE FROM opportunities WHERE title LIKE '${QA_PREFIX}%'`);
  await pool.query(`DELETE FROM skills WHERE skill_name LIKE '${QA_SKILL_PREFIX}%'`);
  await pool.query("DELETE FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test')");
  await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
}

afterAll(async () => {
  try { await cleanup(); } finally { await pool.end(); }
});

describe('Opportunities authentication and CRUD', () => {
  test('requires authentication for list/create/get/update/delete', async () => {
    const id = '00000000-0000-7000-8000-000000000080';
    expect((await request(app).get('/api/opportunities')).status).toBe(401);
    expect((await request(app).post('/api/opportunities').send({ title: 'x' })).status).toBe(401);
    expect((await request(app).get(`/api/opportunities/${id}`)).status).toBe(401);
    expect((await request(app).put(`/api/opportunities/${id}`).send({ title: 'x' })).status).toBe(401);
    expect((await request(app).delete(`/api/opportunities/${id}`)).status).toBe(401);
  });

  test('creates, lists, gets, updates, and deletes an opportunity', async () => {
    const cookie = await login();
    const opportunityId = await createOpportunity(cookie);

    const list = await request(app).get('/api/opportunities').set('Cookie', cookie);
    expect(list.status).toBe(200);
    expect(list.body.opportunities.some((x) => x.opportunityId === opportunityId)).toBe(true);

    const get = await request(app).get(`/api/opportunities/${opportunityId}`).set('Cookie', cookie);
    expect(get.status).toBe(200);
    expect(get.body.opportunity.opportunityId).toBe(opportunityId);

    const update = await request(app)
      .put(`/api/opportunities/${opportunityId}`)
      .set('Cookie', cookie)
      .send({ title: 'Updated Opportunity', organization: null });
    expect(update.status).toBe(200);
    expect(update.body.opportunity.title).toBe('Updated Opportunity');
    expect(update.body.opportunity.organization).toBeNull();

    const del = await request(app).delete(`/api/opportunities/${opportunityId}`).set('Cookie', cookie);
    expect(del.status).toBe(204);
    expect((await request(app).get(`/api/opportunities/${opportunityId}`).set('Cookie', cookie)).status).toBe(404);
  });

  test('uses authentication but no fabricated ownership restriction because opportunities are shared reference data', async () => {
    const owner = await login();
    const otherUser = await login();
    const opportunityId = await createOpportunity(owner);

    const get = await request(app).get(`/api/opportunities/${opportunityId}`).set('Cookie', otherUser);
    expect(get.status).toBe(200);

    await request(app).delete(`/api/opportunities/${opportunityId}`).set('Cookie', otherUser);
  });
});

describe('Opportunity validation and not-found handling', () => {
  test('rejects invalid UUID', async () => {
    const cookie = await login();
    const res = await request(app).get('/api/opportunities/not-a-uuid').set('Cookie', cookie);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rejects invalid create/update input and mass-assignment fields', async () => {
    const cookie = await login();
    expect((await request(app).post('/api/opportunities').set('Cookie', cookie).send({ organization: 'missing title' })).status).toBe(400);
    expect((await request(app).post('/api/opportunities').set('Cookie', cookie).send({ title: 'x', opportunityId: '00000000-0000-7000-8000-000000000001' })).status).toBe(400);
    expect((await request(app).put('/api/opportunities/00000000-0000-7000-8000-000000000080').set('Cookie', cookie).send({ opportunityId: 'x' })).status).toBe(400);
  });

  test('returns 404 for missing opportunity', async () => {
    const cookie = await login();
    const id = '00000000-0000-7000-8000-0000000000ff';
    expect((await request(app).get(`/api/opportunities/${id}`).set('Cookie', cookie)).status).toBe(404);
    expect((await request(app).put(`/api/opportunities/${id}`).set('Cookie', cookie).send({ title: 'x' })).status).toBe(404);
    expect((await request(app).delete(`/api/opportunities/${id}`).set('Cookie', cookie)).status).toBe(404);
  });
});

describe('Opportunity skills', () => {
  test('adds an existing skill, prevents duplicate association, lists it, and removes it', async () => {
    const cookie = await login();
    const opportunityId = await createOpportunity(cookie);

    const skillInsert = await pool.query(
      'INSERT INTO skills (skill_name) VALUES ($1) ON CONFLICT (skill_name) DO UPDATE SET skill_name = EXCLUDED.skill_name RETURNING skill_id',
      [uniqueSkillName()]
    );
    const skillId = skillInsert.rows[0].skill_id;

    const add = await request(app)
      .post(`/api/opportunities/${opportunityId}/skills`)
      .set('Cookie', cookie)
      .send({ skillId, importanceLevel: 5 });
    expect(add.status).toBe(201);
    expect(add.body.skill).toMatchObject({ skillId, importanceLevel: 5 });

    const duplicate = await request(app)
      .post(`/api/opportunities/${opportunityId}/skills`)
      .set('Cookie', cookie)
      .send({ skillId });
    expect(duplicate.status).toBe(409);

    const list = await request(app).get(`/api/opportunities/${opportunityId}/skills`).set('Cookie', cookie);
    expect(list.status).toBe(200);
    expect(list.body.skills.some((x) => x.skillId === skillId && x.importanceLevel === 5)).toBe(true);

    const remove = await request(app)
      .delete(`/api/opportunities/${opportunityId}/skills/${skillId}`)
      .set('Cookie', cookie);
    expect(remove.status).toBe(204);

    const removeAgain = await request(app)
      .delete(`/api/opportunities/${opportunityId}/skills/${skillId}`)
      .set('Cookie', cookie);
    expect(removeAgain.status).toBe(404);
  });

  test('can resolve/create a canonical skill by name without duplicate skills', async () => {
    const cookie = await login();
    const opportunityId = await createOpportunity(cookie);
    const skillName = uniqueSkillName();

    const first = await request(app)
      .post(`/api/opportunities/${opportunityId}/skills`)
      .set('Cookie', cookie)
      .send({ skillName });
    expect(first.status).toBe(201);

    const secondOpportunityId = await createOpportunity(cookie);
    const second = await request(app)
      .post(`/api/opportunities/${secondOpportunityId}/skills`)
      .set('Cookie', cookie)
      .send({ skillName });
    expect(second.status).toBe(201);
    expect(second.body.skill.skillId).toBe(first.body.skill.skillId);

    const count = await pool.query('SELECT count(*)::int AS count FROM skills WHERE skill_name = $1', [skillName]);
    expect(count.rows[0].count).toBe(1);
  });

  test('honors foreign-key restriction when an opportunity is referenced', async () => {
    const cookie = await login();
    const opportunityId = await createOpportunity(cookie);

    const email = uniqueTestEmail();
    const password = 'correct-horse-battery';
    await request(app).post('/api/auth/register').send({ email, password });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    const userCookie = loginRes.headers['set-cookie'];
    const profileRes = await request(app).post('/api/profiles').set('Cookie', userCookie).send({ fullName: 'Opportunity FK Tester' });
    const documentRes = await request(app).post('/api/documents').set('Cookie', userCookie).send({
      fileName: 'qa.pdf',
      objectKey: `qa-test/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
      mimeType: 'application/pdf',
      fileSizeBytes: 1,
    });
    await request(app).post('/api/analyses').set('Cookie', userCookie).send({
      documentId: documentRes.body.document.documentId,
      opportunityId,
    });

    const del = await request(app).delete(`/api/opportunities/${opportunityId}`).set('Cookie', cookie);
    expect(del.status).toBe(409);
    expect(del.body.error.code).toBe('FOREIGN_KEY_RESTRICTION');
  });
});
