// tests/integration/career-alignments.test.js
//
// Exercises /api/analyses/:analysisId/career-alignments against the
// real local PostgreSQL database, including the deterministic
// matched/missing skill-matching logic against real rows.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");
const {
  createTestOpportunity,
  createTestSkill,
  attachOpportunitySkill,
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
    "DELETE FROM career_targets WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))"
  );
  await pool.query(
    "DELETE FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test')"
  );
  await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
  await cleanupAnalysisFixtures();
  await pool.end();
});

async function registerLoginAndCreateProfile(fullName = "Alignment Tester") {
  const email = uniqueTestEmail();
  const password = "correct-horse-battery";

  await request(app).post("/api/auth/register").send({ email, password });
  const loginRes = await request(app).post("/api/auth/login").send({ email, password });
  const cookie = loginRes.headers["set-cookie"];

  await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName });

  return { cookie };
}

async function createTestAnalysis(cookie, opportunityId) {
  const docRes = await request(app)
    .post("/api/documents")
    .set("Cookie", cookie)
    .send({
      fileName: "resume.pdf",
      objectKey: `qa-test/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
      mimeType: "application/pdf",
      fileSizeBytes: 1024,
    });

  const analysisRes = await request(app)
    .post("/api/analyses")
    .set("Cookie", cookie)
    .send({ documentId: docRes.body.document.documentId, opportunityId });

  return analysisRes.body.analysis.analysisId;
}

async function createTestCareerTarget(cookie) {
  const res = await request(app)
    .post("/api/career-targets")
    .set("Cookie", cookie)
    .send({ targetRole: "QA Analysis Target" });
  return res.body.careerTarget.careerTargetId;
}

async function attachTargetSkill(cookie, careerTargetId, skillId) {
  await request(app)
    .post(`/api/career-targets/${careerTargetId}/skills`)
    .set("Cookie", cookie)
    .send({ skillId });
}

describe("POST /api/analyses/:analysisId/career-alignments", () => {
  test("requires authentication", async () => {
    const res = await request(app)
      .post("/api/analyses/00000000-0000-7000-8000-000000000001/career-alignments")
      .send({ careerTargetId: "00000000-0000-7000-8000-000000000002" });
    expect(res.status).toBe(401);
  });

  test("rejects a missing careerTargetId with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const opportunityId = await createTestOpportunity();
    const analysisId = await createTestAnalysis(cookie, opportunityId);

    const res = await request(app)
      .post(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", cookie)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects a career target that doesn't exist with 404", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const opportunityId = await createTestOpportunity();
    const analysisId = await createTestAnalysis(cookie, opportunityId);

    const res = await request(app)
      .post(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", cookie)
      .send({ careerTargetId: "00000000-0000-7000-8000-000000000fff" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CAREER_TARGET_NOT_FOUND");
  });

  test("rejects a career target belonging to another user's profile", async () => {
    const owner = await registerLoginAndCreateProfile("CA Owner");
    const careerTargetId = await createTestCareerTarget(owner.cookie);

    const attacker = await registerLoginAndCreateProfile("CA Attacker");
    const opportunityId = await createTestOpportunity();
    const analysisId = await createTestAnalysis(attacker.cookie, opportunityId);

    const res = await request(app)
      .post(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", attacker.cookie)
      .send({ careerTargetId });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CAREER_TARGET_NOT_FOUND");
  });

  test("cannot create a career alignment on another user's analysis", async () => {
    const owner = await registerLoginAndCreateProfile("CA Owner2");
    const opportunityId = await createTestOpportunity();
    const analysisId = await createTestAnalysis(owner.cookie, opportunityId);
    const careerTargetId = await createTestCareerTarget(owner.cookie);

    const attacker = await registerLoginAndCreateProfile("CA Attacker2");
    const res = await request(app)
      .post(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", attacker.cookie)
      .send({ careerTargetId });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ANALYSIS_NOT_FOUND");
  });

  test("computes deterministic matched/missing skills and alignment_score from real data", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const skillMatched = await createTestSkill();
    const skillMissing = await createTestSkill();

    const opportunityId = await createTestOpportunity();
    await attachOpportunitySkill(opportunityId, skillMatched.skill_id);
    await attachOpportunitySkill(opportunityId, skillMissing.skill_id);

    const analysisId = await createTestAnalysis(cookie, opportunityId);

    const careerTargetId = await createTestCareerTarget(cookie);
    await attachTargetSkill(cookie, careerTargetId, skillMatched.skill_id);
    // skillMissing intentionally NOT attached to the career target

    const res = await request(app)
      .post(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", cookie)
      .send({ careerTargetId });

    expect(res.status).toBe(201);
    expect(res.body.careerAlignment.alignmentScore).toBe(50);
    expect(res.body.careerAlignment.matchingFactors).toBe(skillMatched.skill_name);
    expect(res.body.careerAlignment.missingFactors).toBe(skillMissing.skill_name);
  });

  test("scores 100 when the opportunity has no required skills", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const opportunityId = await createTestOpportunity();
    const analysisId = await createTestAnalysis(cookie, opportunityId);
    const careerTargetId = await createTestCareerTarget(cookie);

    const res = await request(app)
      .post(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", cookie)
      .send({ careerTargetId });

    expect(res.status).toBe(201);
    expect(res.body.careerAlignment.alignmentScore).toBe(100);
    expect(res.body.careerAlignment.matchingFactors).toBeNull();
    expect(res.body.careerAlignment.missingFactors).toBeNull();
  });

  test("ignores a client-supplied alignmentScore (not fabricated/trusted from the client)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const opportunityId = await createTestOpportunity();
    const analysisId = await createTestAnalysis(cookie, opportunityId);
    const careerTargetId = await createTestCareerTarget(cookie);

    const res = await request(app)
      .post(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", cookie)
      .send({ careerTargetId, alignmentScore: 1 });

    expect(res.status).toBe(201);
    expect(res.body.careerAlignment.alignmentScore).toBe(100); // computed, not the client's 1
  });
});

describe("GET /api/analyses/:analysisId/career-alignments", () => {
  test("lists only the caller's own career alignments", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const opportunityId = await createTestOpportunity();
    const analysisId = await createTestAnalysis(cookie, opportunityId);
    const careerTargetId = await createTestCareerTarget(cookie);

    await request(app)
      .post(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", cookie)
      .send({ careerTargetId });

    const res = await request(app)
      .get(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.careerAlignments.length).toBeGreaterThan(0);
  });
});

describe("DELETE /api/analyses/:analysisId/career-alignments/:careerAlignmentId", () => {
  test("deletes the caller's own career alignment", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const opportunityId = await createTestOpportunity();
    const analysisId = await createTestAnalysis(cookie, opportunityId);
    const careerTargetId = await createTestCareerTarget(cookie);

    const create = await request(app)
      .post(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", cookie)
      .send({ careerTargetId });

    const del = await request(app)
      .delete(`/api/analyses/${analysisId}/career-alignments/${create.body.careerAlignment.careerAlignmentId}`)
      .set("Cookie", cookie);
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/api/analyses/${analysisId}/career-alignments/${create.body.careerAlignment.careerAlignmentId}`)
      .set("Cookie", cookie);
    expect(get.status).toBe(404);
  });

  test("returns 404 deleting another user's career alignment", async () => {
    const owner = await registerLoginAndCreateProfile("CA Owner3");
    const opportunityId = await createTestOpportunity();
    const analysisId = await createTestAnalysis(owner.cookie, opportunityId);
    const careerTargetId = await createTestCareerTarget(owner.cookie);
    const create = await request(app)
      .post(`/api/analyses/${analysisId}/career-alignments`)
      .set("Cookie", owner.cookie)
      .send({ careerTargetId });

    const attacker = await registerLoginAndCreateProfile("CA Attacker3");
    const res = await request(app)
      .delete(`/api/analyses/${analysisId}/career-alignments/${create.body.careerAlignment.careerAlignmentId}`)
      .set("Cookie", attacker.cookie);

    expect(res.status).toBe(404);
  });
});
