const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/database');
const { uniqueTestEmail } = require('../helpers/uniqueEmail');
const { createTestOpportunity, cleanupAnalysisFixtures } = require('../helpers/analysisFixtures');
const { createAccessToken } = require('../../src/utils/token');

async function registerLoginAndCreateProfile(fullName = 'Interview Tester') {
  const email = uniqueTestEmail();
  const password = 'correct-horse-battery';
  await request(app).post('/api/auth/register').send({ email, password });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  const cookie = login.headers['set-cookie'];
  const profile = await request(app).post('/api/profiles').set('Cookie', cookie).send({ fullName });
  return { cookie, profileId: profile.body.profile.profileId };
}

async function createInterview(cookie, opportunityId = null, overrides = {}) {
  const res = await request(app).post('/api/interviews').set('Cookie', cookie).send({
    interviewType: 'Technical',
    opportunityId,
    ...overrides,
  });
  return res;
}

async function createQuestion(cookie, interviewId, overrides = {}) {
  return request(app).post(`/api/interviews/${interviewId}/questions`).set('Cookie', cookie).send({
    questionText: 'Explain the design.',
    questionType: 'technical',
    orderIndex: 0,
    ...overrides,
  });
}

async function createAnswer(cookie, interviewId, questionId, overrides = {}) {
  return request(app)
    .post(`/api/interviews/${interviewId}/questions/${questionId}/answers`)
    .set('Cookie', cookie)
    .send({ answerText: 'A valid answer.', answerType: 'text', ...overrides });
}

async function createEvaluation(cookie, interviewId, questionId, answerId, overrides = {}) {
  return request(app)
    .post(`/api/interviews/${interviewId}/questions/${questionId}/answers/${answerId}/evaluations`)
    .set('Cookie', cookie)
    .send({ score: 80, feedback: 'Good.', ...overrides });
}

afterAll(async () => {
  await pool.query("DELETE FROM interviews WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))");
  await pool.query("DELETE FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test')");
  await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
  await cleanupAnalysisFixtures();
  await pool.end();
});

describe('Interviews', () => {
  test('requires authentication', async () => {
    const res = await request(app).get('/api/interviews');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  test('creates and gets an interview, deriving ownership from the authenticated profile', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const opportunityId = await createTestOpportunity();
    const create = await createInterview(cookie, opportunityId, { status: 'created', feedback: 'Practice' });
    expect(create.status).toBe(201);
    expect(create.body.interview).toMatchObject({ interviewType: 'Technical', opportunityId, status: 'created', feedback: 'Practice' });
    expect(create.body.interview.profileId).toBeDefined();

    const get = await request(app).get(`/api/interviews/${create.body.interview.interviewId}`).set('Cookie', cookie);
    expect(get.status).toBe(200);
    expect(get.body.interview.interviewId).toBe(create.body.interview.interviewId);
  });

  test('lists only interviews owned by the caller', async () => {
    const a = await registerLoginAndCreateProfile('Interview A');
    const b = await registerLoginAndCreateProfile('Interview B');
    const created = await createInterview(a.cookie);
    const listA = await request(app).get('/api/interviews').set('Cookie', a.cookie);
    const listB = await request(app).get('/api/interviews').set('Cookie', b.cookie);
    expect(listA.status).toBe(200);
    expect(listA.body.interviews.some((i) => i.interviewId === created.body.interview.interviewId)).toBe(true);
    expect(listB.status).toBe(200);
    expect(listB.body.interviews).toEqual([]);
  });

  test('validates UUIDs and input', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    expect((await request(app).get('/api/interviews/not-a-uuid').set('Cookie', cookie)).status).toBe(400);
    expect((await request(app).post('/api/interviews').set('Cookie', cookie).send({ interviewType: '' })).status).toBe(400);
    expect((await request(app).post('/api/interviews').set('Cookie', cookie).send({ interviewType: 'Technical', opportunityId: 'bad' })).status).toBe(400);
  });

  test('rejects a missing opportunity', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const res = await createInterview(cookie, '00000000-0000-7000-8000-000000000fff');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('OPPORTUNITY_NOT_FOUND');
  });

  test('rejects cross-user get/update/delete', async () => {
    const owner = await registerLoginAndCreateProfile('Interview Owner');
    const attacker = await registerLoginAndCreateProfile('Interview Attacker');
    const created = await createInterview(owner.cookie);
    const id = created.body.interview.interviewId;

    const get = await request(app).get(`/api/interviews/${id}`).set('Cookie', attacker.cookie);
    const update = await request(app).put(`/api/interviews/${id}`).set('Cookie', attacker.cookie).send({ status: 'started' });
    const del = await request(app).delete(`/api/interviews/${id}`).set('Cookie', attacker.cookie);
    expect(get.status).toBe(404);
    expect(update.status).toBe(404);
    expect(del.status).toBe(404);
  });

  test('updates supported fields and ignores mass-assignment fields', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const created = await createInterview(cookie);
    const id = created.body.interview.interviewId;
    const update = await request(app).put(`/api/interviews/${id}`).set('Cookie', cookie).send({
      status: 'started',
      feedback: 'Updated',
      profileId: '00000000-0000-7000-8000-000000000099',
      interviewId: '00000000-0000-7000-8000-000000000099',
    });
    expect(update.status).toBe(200);
    expect(update.body.interview.status).toBe('started');
    expect(update.body.interview.feedback).toBe('Updated');
    expect(update.body.interview.interviewId).toBe(id);
  });

  test('allows duplicate interviews because the schema defines no uniqueness constraint', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const a = await createInterview(cookie, null, { interviewType: 'Technical', status: 'created' });
    const b = await createInterview(cookie, null, { interviewType: 'Technical', status: 'created' });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body.interview.interviewId).not.toBe(b.body.interview.interviewId);
  });

  test('deletes an interview and cascades questions, answers, and evaluations', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const interview = await createInterview(cookie);
    const question = await createQuestion(cookie, interview.body.interview.interviewId);
    const answer = await createAnswer(cookie, interview.body.interview.interviewId, question.body.interviewQuestion.questionId);
    const evaluation = await createEvaluation(cookie, interview.body.interview.interviewId, question.body.interviewQuestion.questionId, answer.body.interviewAnswer.answerId);
    expect(evaluation.status).toBe(201);

    const del = await request(app).delete(`/api/interviews/${interview.body.interview.interviewId}`).set('Cookie', cookie);
    expect(del.status).toBe(204);
    const child = await request(app).get(`/api/interviews/${interview.body.interview.interviewId}/questions`).set('Cookie', cookie);
    expect(child.status).toBe(404);
  });
});

describe('Interview Questions', () => {
  test('requires an existing owned interview and supports CRUD', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const interview = await createInterview(cookie);
    const interviewId = interview.body.interview.interviewId;
    const missing = await createQuestion(cookie, '00000000-0000-7000-8000-000000000fff');
    expect(missing.status).toBe(404);

    const create = await createQuestion(cookie, interviewId);
    expect(create.status).toBe(201);
    const id = create.body.interviewQuestion.questionId;
    const list = await request(app).get(`/api/interviews/${interviewId}/questions`).set('Cookie', cookie);
    expect(list.status).toBe(200);
    expect(list.body.interviewQuestions.length).toBe(1);
    expect((await request(app).get(`/api/interviews/${interviewId}/questions/not-a-uuid`).set('Cookie', cookie)).status).toBe(400);

    const update = await request(app).put(`/api/interviews/${interviewId}/questions/${id}`).set('Cookie', cookie).send({ questionText: 'Updated question' });
    expect(update.status).toBe(200);
    expect(update.body.interviewQuestion.questionText).toBe('Updated question');

    const del = await request(app).delete(`/api/interviews/${interviewId}/questions/${id}`).set('Cookie', cookie);
    expect(del.status).toBe(204);
    expect((await request(app).get(`/api/interviews/${interviewId}/questions/${id}`).set('Cookie', cookie)).status).toBe(404);
  });

  test('prevents cross-user question access and modification', async () => {
    const owner = await registerLoginAndCreateProfile();
    const attacker = await registerLoginAndCreateProfile();
    const interview = await createInterview(owner.cookie);
    const question = await createQuestion(owner.cookie, interview.body.interview.interviewId);
    const path = `/api/interviews/${interview.body.interview.interviewId}/questions/${question.body.interviewQuestion.questionId}`;
    expect((await request(app).get(path).set('Cookie', attacker.cookie)).status).toBe(404);
    expect((await request(app).put(path).set('Cookie', attacker.cookie).send({ questionText: 'x' })).status).toBe(404);
    expect((await request(app).delete(path).set('Cookie', attacker.cookie)).status).toBe(404);
  });
});

describe('Interview Answers', () => {
  test('supports CRUD and validates missing question', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const interview = await createInterview(cookie);
    const interviewId = interview.body.interview.interviewId;
    const question = await createQuestion(cookie, interviewId);
    const questionId = question.body.interviewQuestion.questionId;
    const missing = await createAnswer(cookie, interviewId, '00000000-0000-7000-8000-000000000fff');
    expect(missing.status).toBe(404);

    const create = await createAnswer(cookie, interviewId, questionId);
    expect(create.status).toBe(201);
    const answerId = create.body.interviewAnswer.answerId;
    expect((await request(app).get(`/api/interviews/${interviewId}/questions/${questionId}/answers`).set('Cookie', cookie)).status).toBe(200);
    expect((await request(app).get(`/api/interviews/${interviewId}/questions/${questionId}/answers/${answerId}`).set('Cookie', cookie)).status).toBe(200);
    expect((await request(app).get(`/api/interviews/${interviewId}/questions/${questionId}/answers/not-a-uuid`).set('Cookie', cookie)).status).toBe(400);

    const update = await request(app).put(`/api/interviews/${interviewId}/questions/${questionId}/answers/${answerId}`).set('Cookie', cookie).send({ answerText: 'Updated' });
    expect(update.status).toBe(200);
    expect(update.body.interviewAnswer.answerText).toBe('Updated');
    expect((await request(app).delete(`/api/interviews/${interviewId}/questions/${questionId}/answers/${answerId}`).set('Cookie', cookie)).status).toBe(204);
  });

  test('prevents cross-user answer access and modification', async () => {
    const owner = await registerLoginAndCreateProfile();
    const attacker = await registerLoginAndCreateProfile();
    const interview = await createInterview(owner.cookie);
    const question = await createQuestion(owner.cookie, interview.body.interview.interviewId);
    const answer = await createAnswer(owner.cookie, interview.body.interview.interviewId, question.body.interviewQuestion.questionId);
    const path = `/api/interviews/${interview.body.interview.interviewId}/questions/${question.body.interviewQuestion.questionId}/answers/${answer.body.interviewAnswer.answerId}`;
    expect((await request(app).get(path).set('Cookie', attacker.cookie)).status).toBe(404);
    expect((await request(app).put(path).set('Cookie', attacker.cookie).send({ answerText: 'x' })).status).toBe(404);
    expect((await request(app).delete(path).set('Cookie', attacker.cookie)).status).toBe(404);
  });
});

describe('Interview Evaluations', () => {
  test('supports create/retrieve/update/delete and validates score', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const interview = await createInterview(cookie);
    const interviewId = interview.body.interview.interviewId;
    const question = await createQuestion(cookie, interviewId);
    const questionId = question.body.interviewQuestion.questionId;
    const answer = await createAnswer(cookie, interviewId, questionId);
    const answerId = answer.body.interviewAnswer.answerId;

    expect((await createEvaluation(cookie, interviewId, questionId, answerId, { score: 101 })).status).toBe(400);
    const create = await createEvaluation(cookie, interviewId, questionId, answerId);
    expect(create.status).toBe(201);
    const evaluationId = create.body.interviewEvaluation.evaluationId;
    const base = `/api/interviews/${interviewId}/questions/${questionId}/answers/${answerId}/evaluations`;
    expect((await request(app).get(`${base}/${evaluationId}`).set('Cookie', cookie)).status).toBe(200);
    expect((await request(app).get(`${base}/not-a-uuid`).set('Cookie', cookie)).status).toBe(400);

    const update = await request(app).put(`${base}/${evaluationId}`).set('Cookie', cookie).send({ score: 95, feedback: 'Excellent' });
    expect(update.status).toBe(200);
    expect(update.body.interviewEvaluation.score).toBe(95);
    expect((await request(app).delete(`${base}/${evaluationId}`).set('Cookie', cookie)).status).toBe(204);
    expect((await request(app).get(`${base}/${evaluationId}`).set('Cookie', cookie)).status).toBe(404);
  });

  test('prevents cross-user evaluation access and validates the complete relationship', async () => {
    const owner = await registerLoginAndCreateProfile();
    const attacker = await registerLoginAndCreateProfile();
    const interview = await createInterview(owner.cookie);
    const question = await createQuestion(owner.cookie, interview.body.interview.interviewId);
    const answer = await createAnswer(owner.cookie, interview.body.interview.interviewId, question.body.interviewQuestion.questionId);
    const evaluation = await createEvaluation(owner.cookie, interview.body.interview.interviewId, question.body.interviewQuestion.questionId, answer.body.interviewAnswer.answerId);
    const base = `/api/interviews/${interview.body.interview.interviewId}/questions/${question.body.interviewQuestion.questionId}/answers/${answer.body.interviewAnswer.answerId}/evaluations/${evaluation.body.interviewEvaluation.evaluationId}`;
    expect((await request(app).get(base).set('Cookie', attacker.cookie)).status).toBe(404);
    expect((await request(app).put(base).set('Cookie', attacker.cookie).send({ score: 1 })).status).toBe(404);
    expect((await request(app).delete(base).set('Cookie', attacker.cookie)).status).toBe(404);

    const wrongAnswer = await request(app)
      .get(`/api/interviews/${interview.body.interview.interviewId}/questions/${question.body.interviewQuestion.questionId}/answers/00000000-0000-7000-8000-000000000fff/evaluations/${evaluation.body.interviewEvaluation.evaluationId}`)
      .set('Cookie', owner.cookie);
    expect(wrongAnswer.status).toBe(404);
  });
});

describe('Interview database/error behavior', () => {
  test('database failure is returned safely for authenticated access', async () => {
    const token = createAccessToken({
      user_id: '00000000-0000-7000-8000-000000000001',
      email: 'failure@example.com',
      role: 'user',
    });
    const originalUrl = process.env.DATABASE_URL;
    jest.resetModules();
    process.env.DATABASE_URL = originalUrl.replace(/:\d+\//, ':59999/');
    const isolatedApp = require('../../src/app');
    const isolatedPool = require('../../src/config/database').pool;
    const res = await request(isolatedApp).get('/api/interviews').set('Cookie', [`clario_access=${token}`]);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'DATABASE_ERROR', message: 'Database operation failed' } });
    expect(JSON.stringify(res.body)).not.toMatch(/59999|failure@example.com|localhost/);
    await isolatedPool.end();
    jest.resetModules();
    process.env.DATABASE_URL = originalUrl;
  }, 15000);

  test('database restricts deletion of an opportunity referenced by an interview', async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const opportunityId = await createTestOpportunity();
    const interview = await createInterview(cookie, opportunityId);
    expect(interview.status).toBe(201);
    await expect(pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [opportunityId])).rejects.toMatchObject({ code: '23503' });
  });
});
