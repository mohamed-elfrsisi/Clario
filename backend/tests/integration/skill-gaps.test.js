// tests/integration/skill-gaps.test.js
//
// Exercises /api/analyses/:analysisId/skill-gaps against the real
// local PostgreSQL database.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");
const {
  createTestOpportunity,
  createTestSkill,
  cleanupAnalysisFixtures,
} = require("../helpers/analysisFixtures");

afterAll(async () => {
  await pool.query(
    "DELETE FROM analyses WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))"
  );
  await pool.query(
    "DELETE FROM documents WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))"
  );
  await pool.query(
    "DELETE FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test')"
  );
  await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
  await cleanupAnalysisFixtures();
  await pool.end();
});

async function registerLoginAndCreateProfile(fullName = "Skill Gap Tester") {
  const email = uniqueTestEmail();
  const password = "correct-horse-battery";

  await request(app).post("/api/auth/register").send({ email, password });
  const loginRes = await request(app).post("/api/auth/login").send({ email, password });
  const cookie = loginRes.headers["set-cookie"];

  await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName });

  return { cookie };
}

async function createTestAnalysis(cookie) {
  const docRes = await request(app)
    .post("/api/documents")
    .set("Cookie", cookie)
    .send({
      fileName: "resume.pdf",
      objectKey: `qa-test/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
      mimeType: "application/pdf",
      fileSizeBytes: 1024,
    });
  const opportunityId = await createTestOpportunity();

  const analysisRes = await request(app)
    .post("/api/analyses")
    .set("Cookie", cookie)
    .send({ documentId: docRes.body.document.documentId, opportunityId });

  return analysisRes.body.analysis.analysisId;
}

describe("POST /api/analyses/:analysisId/skill-gaps", () => {
  test("requires authentication", async () => {
    const res = await request(app)
      .post("/api/analyses/00000000-0000-7000-8000-000000000001/skill-gaps")
      .send({ skillId: "00000000-0000-7000-8000-000000000002" });
    expect(res.status).toBe(401);
  });

  test("rejects an invalid analysisId with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const res = await request(app)
      .post("/api/analyses/not-a-uuid/skill-gaps")
      .set("Cookie", cookie)
      .send({ skillId: "00000000-0000-7000-8000-000000000002" });
    expect(res.status).toBe(400);
  });

  test("rejects a missing skillId with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const analysisId = await createTestAnalysis(cookie);

    const res = await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects out-of-range level values with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const analysisId = await createTestAnalysis(cookie);
    const skill = await createTestSkill();

    const res = await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie)
      .send({ skillId: skill.skill_id, currentLevel: 9 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects a skill that doesn't exist with 404 SKILL_NOT_FOUND", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const analysisId = await createTestAnalysis(cookie);

    const res = await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie)
      .send({ skillId: "00000000-0000-7000-8000-000000000fff" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SKILL_NOT_FOUND");
  });

  test("cannot create a skill gap on another user's analysis", async () => {
    const owner = await registerLoginAndCreateProfile("SG Owner");
    const analysisId = await createTestAnalysis(owner.cookie);
    const skill = await createTestSkill();

    const attacker = await registerLoginAndCreateProfile("SG Attacker");
    const res = await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", attacker.cookie)
      .send({ skillId: skill.skill_id });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ANALYSIS_NOT_FOUND");
  });

  test("creates a skill gap with gap_level computed by the database", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const analysisId = await createTestAnalysis(cookie);
    const skill = await createTestSkill();

    const res = await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie)
      .send({ skillId: skill.skill_id, currentLevel: 2, requiredLevel: 4, priorityLevel: 5 });

    expect(res.status).toBe(201);
    expect(res.body.skillGap).toMatchObject({
      skillId: skill.skill_id,
      currentLevel: 2,
      requiredLevel: 4,
      gapLevel: 2,
      priorityLevel: 5,
    });
  });

  test("re-posting the same skill updates the existing row instead of duplicating (no unique constraint, dedup at service level)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const analysisId = await createTestAnalysis(cookie);
    const skill = await createTestSkill();

    const first = await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie)
      .send({ skillId: skill.skill_id, currentLevel: 1, requiredLevel: 3 });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie)
      .send({ skillId: skill.skill_id, currentLevel: 3, requiredLevel: 3 });
    expect(second.status).toBe(200);
    expect(second.body.skillGap.skillGapId).toBe(first.body.skillGap.skillGapId);
    expect(second.body.skillGap.currentLevel).toBe(3);
    expect(second.body.skillGap.gapLevel).toBe(0);

    const list = await request(app)
      .get(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie);
    expect(list.body.skillGaps.filter((g) => g.skillId === skill.skill_id)).toHaveLength(1);
  });
});

describe("GET /api/analyses/:analysisId/skill-gaps", () => {
  test("lists skill gaps for the caller's own analysis only", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const analysisId = await createTestAnalysis(cookie);
    const skill = await createTestSkill();

    await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie)
      .send({ skillId: skill.skill_id });

    const res = await request(app)
      .get(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.skillGaps.some((g) => g.skillId === skill.skill_id)).toBe(true);
  });
});

describe("PUT /api/analyses/:analysisId/skill-gaps/:skillGapId", () => {
  test("updates level/priority/notes", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const analysisId = await createTestAnalysis(cookie);
    const skill = await createTestSkill();

    const create = await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie)
      .send({ skillId: skill.skill_id, currentLevel: 1, requiredLevel: 5 });
    const skillGapId = create.body.skillGap.skillGapId;

    const res = await request(app)
      .put(`/api/analyses/${analysisId}/skill-gaps/${skillGapId}`)
      .set("Cookie", cookie)
      .send({ currentLevel: 5, notes: "Closed the gap" });

    expect(res.status).toBe(200);
    expect(res.body.skillGap.currentLevel).toBe(5);
    expect(res.body.skillGap.gapLevel).toBe(0);
    expect(res.body.skillGap.notes).toBe("Closed the gap");
  });

  test("returns 404 for a skill gap belonging to another user's analysis", async () => {
    const owner = await registerLoginAndCreateProfile("SG Owner2");
    const analysisId = await createTestAnalysis(owner.cookie);
    const skill = await createTestSkill();
    const create = await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", owner.cookie)
      .send({ skillId: skill.skill_id });

    const attacker = await registerLoginAndCreateProfile("SG Attacker2");
    const res = await request(app)
      .put(`/api/analyses/${analysisId}/skill-gaps/${create.body.skillGap.skillGapId}`)
      .set("Cookie", attacker.cookie)
      .send({ currentLevel: 5 });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/analyses/:analysisId/skill-gaps/:skillGapId", () => {
  test("deletes the caller's own skill gap", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const analysisId = await createTestAnalysis(cookie);
    const skill = await createTestSkill();
    const create = await request(app)
      .post(`/api/analyses/${analysisId}/skill-gaps`)
      .set("Cookie", cookie)
      .send({ skillId: skill.skill_id });

    const del = await request(app)
      .delete(`/api/analyses/${analysisId}/skill-gaps/${create.body.skillGap.skillGapId}`)
      .set("Cookie", cookie);
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/api/analyses/${analysisId}/skill-gaps/${create.body.skillGap.skillGapId}`)
      .set("Cookie", cookie);
    expect(get.status).toBe(404);
  });
});
