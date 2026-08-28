// tests/integration/analyses.test.js
//
// Exercises /api/analyses against the real local PostgreSQL database.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");
const {
  createTestOpportunity,
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

async function registerLoginAndCreateProfile(fullName = "Analysis Tester") {
  const email = uniqueTestEmail();
  const password = "correct-horse-battery";

  await request(app).post("/api/auth/register").send({ email, password });
  const loginRes = await request(app).post("/api/auth/login").send({ email, password });
  const cookie = loginRes.headers["set-cookie"];

  await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName });

  return { cookie, email };
}

async function createTestDocument(cookie) {
  const res = await request(app)
    .post("/api/documents")
    .set("Cookie", cookie)
    .send({
      fileName: "resume.pdf",
      objectKey: `qa-test/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
      mimeType: "application/pdf",
      fileSizeBytes: 1024,
    });
  return res.body.document.documentId;
}

describe("POST /api/analyses", () => {
  test("requires authentication", async () => {
    const res = await request(app).post("/api/analyses").send({
      documentId: "00000000-0000-7000-8000-000000000001",
      opportunityId: "00000000-0000-7000-8000-000000000002",
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  test("rejects invalid documentId/opportunityId UUIDs with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/analyses")
      .set("Cookie", cookie)
      .send({ documentId: "not-a-uuid", opportunityId: "also-not-a-uuid" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects a missing document with 404 DOCUMENT_NOT_FOUND", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const opportunityId = await createTestOpportunity();

    const res = await request(app)
      .post("/api/analyses")
      .set("Cookie", cookie)
      .send({ documentId: "00000000-0000-7000-8000-000000000fff", opportunityId });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("DOCUMENT_NOT_FOUND");
  });

  test("rejects a missing opportunity with 404 OPPORTUNITY_NOT_FOUND", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const documentId = await createTestDocument(cookie);

    const res = await request(app)
      .post("/api/analyses")
      .set("Cookie", cookie)
      .send({ documentId, opportunityId: "00000000-0000-7000-8000-000000000fff" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("OPPORTUNITY_NOT_FOUND");
  });

  test("rejects a document owned by another user with 404 (no cross-user resource use)", async () => {
    const owner = await registerLoginAndCreateProfile("Doc Owner");
    const documentId = await createTestDocument(owner.cookie);

    const attacker = await registerLoginAndCreateProfile("Attacker");
    const opportunityId = await createTestOpportunity();

    const res = await request(app)
      .post("/api/analyses")
      .set("Cookie", attacker.cookie)
      .send({ documentId, opportunityId });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("DOCUMENT_NOT_FOUND");
  });

  test("creates an analysis owned by the caller, with generation-engine fields null", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const documentId = await createTestDocument(cookie);
    const opportunityId = await createTestOpportunity();

    const res = await request(app)
      .post("/api/analyses")
      .set("Cookie", cookie)
      .send({ documentId, opportunityId });

    expect(res.status).toBe(201);
    expect(res.body.analysis).toMatchObject({
      documentId,
      opportunityId,
      matchPercentage: null,
      parseabilityScore: null,
      summary: null,
    });
    expect(res.body.analysis.analysisId).toBeDefined();
  });

  test("ignores unexpected fields (no mass assignment of profileId/matchPercentage)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const documentId = await createTestDocument(cookie);
    const opportunityId = await createTestOpportunity();

    const res = await request(app)
      .post("/api/analyses")
      .set("Cookie", cookie)
      .send({
        documentId,
        opportunityId,
        matchPercentage: 99.9,
        profileId: "00000000-0000-7000-8000-000000000099",
      });

    expect(res.status).toBe(201);
    expect(res.body.analysis.matchPercentage).toBeNull();
    expect(res.body.analysis.profileId).not.toBe("00000000-0000-7000-8000-000000000099");
  });
});

describe("GET /api/analyses", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/analyses");
    expect(res.status).toBe(401);
  });

  test("lists only the caller's own analyses", async () => {
    const a = await registerLoginAndCreateProfile("Lister A");
    const documentIdA = await createTestDocument(a.cookie);
    const opportunityId = await createTestOpportunity();
    await request(app)
      .post("/api/analyses")
      .set("Cookie", a.cookie)
      .send({ documentId: documentIdA, opportunityId });

    const b = await registerLoginAndCreateProfile("Lister B");

    const resA = await request(app).get("/api/analyses").set("Cookie", a.cookie);
    const resB = await request(app).get("/api/analyses").set("Cookie", b.cookie);

    expect(resA.status).toBe(200);
    expect(resA.body.analyses.length).toBeGreaterThan(0);
    expect(resB.status).toBe(200);
    expect(resB.body.analyses).toEqual([]);
  });
});

describe("GET /api/analyses/:analysisId", () => {
  test("rejects an invalid UUID with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const res = await request(app).get("/api/analyses/not-a-uuid").set("Cookie", cookie);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("returns 404 for another user's analysis (cross-user access denied)", async () => {
    const owner = await registerLoginAndCreateProfile("Owner");
    const documentId = await createTestDocument(owner.cookie);
    const opportunityId = await createTestOpportunity();
    const createRes = await request(app)
      .post("/api/analyses")
      .set("Cookie", owner.cookie)
      .send({ documentId, opportunityId });
    const analysisId = createRes.body.analysis.analysisId;

    const attacker = await registerLoginAndCreateProfile("Attacker2");
    const res = await request(app)
      .get(`/api/analyses/${analysisId}`)
      .set("Cookie", attacker.cookie);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ANALYSIS_NOT_FOUND");
  });

  test("retrieves the caller's own analysis", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const documentId = await createTestDocument(cookie);
    const opportunityId = await createTestOpportunity();
    const createRes = await request(app)
      .post("/api/analyses")
      .set("Cookie", cookie)
      .send({ documentId, opportunityId });
    const analysisId = createRes.body.analysis.analysisId;

    const res = await request(app).get(`/api/analyses/${analysisId}`).set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.analysis.analysisId).toBe(analysisId);
  });
});

describe("DELETE /api/analyses/:analysisId", () => {
  test("deletes the caller's own analysis", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const documentId = await createTestDocument(cookie);
    const opportunityId = await createTestOpportunity();
    const createRes = await request(app)
      .post("/api/analyses")
      .set("Cookie", cookie)
      .send({ documentId, opportunityId });
    const analysisId = createRes.body.analysis.analysisId;

    const del = await request(app).delete(`/api/analyses/${analysisId}`).set("Cookie", cookie);
    expect(del.status).toBe(204);

    const getAfter = await request(app).get(`/api/analyses/${analysisId}`).set("Cookie", cookie);
    expect(getAfter.status).toBe(404);
  });

  test("returns 404 deleting another user's analysis", async () => {
    const owner = await registerLoginAndCreateProfile("Owner3");
    const documentId = await createTestDocument(owner.cookie);
    const opportunityId = await createTestOpportunity();
    const createRes = await request(app)
      .post("/api/analyses")
      .set("Cookie", owner.cookie)
      .send({ documentId, opportunityId });
    const analysisId = createRes.body.analysis.analysisId;

    const attacker = await registerLoginAndCreateProfile("Attacker3");
    const res = await request(app)
      .delete(`/api/analyses/${analysisId}`)
      .set("Cookie", attacker.cookie);

    expect(res.status).toBe(404);
  });
});

describe("database unreachable", () => {
  const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;
  const UNREACHABLE_URL =
    "postgresql://clario_user:clario_dev_password@localhost:5433/clario_db";

  afterEach(() => {
    process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
  });

  test("GET /api/analyses returns a safe DATABASE_ERROR without leaking connection details", async () => {
    jest.resetModules();

    const setupRequest = require("supertest");
    const setupApp = require("../../src/app");
    const { uniqueTestEmail: freshUniqueEmail } = require("../helpers/uniqueEmail");
    const email = freshUniqueEmail();
    const password = "correct-horse-battery";
    await setupRequest(setupApp).post("/api/auth/register").send({ email, password });
    const loginRes = await setupRequest(setupApp)
      .post("/api/auth/login")
      .send({ email, password });
    const cookie = loginRes.headers["set-cookie"];

    jest.resetModules();
    process.env.DATABASE_URL = UNREACHABLE_URL;

    const request2 = require("supertest");
    const app2 = require("../../src/app");
    const { pool: brokenPool } = require("../../src/config/database");

    const res = await request2(app2).get("/api/analyses").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DATABASE_ERROR");
    expect(JSON.stringify(res.body)).not.toMatch(/clario_dev_password/);

    await brokenPool.end();
  }, 15000);
});
