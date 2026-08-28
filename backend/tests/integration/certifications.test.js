// tests/integration/certifications.test.js
//
// Exercises /api/certifications against the real local PostgreSQL
// database. Users created here use the qa.*@clario.test pattern so
// afterAll() can clean up exactly what this suite created.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

afterAll(async () => {
  await pool.query(
    "DELETE FROM certifications WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))"
  );
  await pool.query(
    "DELETE FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test')"
  );
  await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
  await pool.end();
});

async function registerLoginAndCreateProfile() {
  const email = uniqueTestEmail();
  const password = "correct-horse-battery";

  await request(app).post("/api/auth/register").send({ email, password });
  const loginRes = await request(app).post("/api/auth/login").send({ email, password });
  const cookie = loginRes.headers["set-cookie"];

  await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName: "Cert Tester" });

  return { cookie };
}

describe("POST /api/certifications", () => {
  test("requires authentication", async () => {
    const res = await request(app).post("/api/certifications").send({ name: "No Auth" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  test("creates a certification owned by the caller's profile", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({
        name: "AWS Certified Solutions Architect",
        issuingOrganization: "Amazon Web Services",
        issueDate: "2022-01-01",
        expirationDate: "2025-01-01",
        credentialId: "ABC-123",
      });

    expect(res.status).toBe(201);
    expect(res.body.certification).toMatchObject({
      name: "AWS Certified Solutions Architect",
      issuingOrganization: "Amazon Web Services",
      credentialId: "ABC-123",
    });
    expect(res.body.certification.certificationId).toBeDefined();
    expect(res.body.certification.profileId).toBeDefined();
  });

  test("rejects a body with no name", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({ issuingOrganization: "Some Org" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects an expirationDate before issueDate with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({ name: "PMP", issueDate: "2023-01-01", expirationDate: "2020-01-01" });

    expect(res.status).toBe(400);
  });

  test("allows a certification with only a name (everything else nullable)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({ name: "Self-taught Certification" });

    expect(res.status).toBe(201);
    expect(res.body.certification.issuingOrganization).toBeNull();
    expect(res.body.certification.issueDate).toBeNull();
    expect(res.body.certification.expirationDate).toBeNull();
    expect(res.body.certification.credentialId).toBeNull();
  });

  test("ignores unexpected fields (no mass assignment)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({
        name: "Mass Assignment Test",
        certificationId: "00000000-0000-7000-8000-000000000099",
        profileId: "00000000-0000-7000-8000-000000000099",
        createdAt: "2000-01-01T00:00:00.000Z",
      });

    expect(res.status).toBe(201);
    expect(res.body.certification.certificationId).not.toBe(
      "00000000-0000-7000-8000-000000000099"
    );
    expect(res.body.certification.profileId).not.toBe(
      "00000000-0000-7000-8000-000000000099"
    );
  });
});

describe("GET /api/certifications", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/certifications");
    expect(res.status).toBe(401);
  });

  test("lists certifications for the caller's profile", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({ name: "Listed Certification" });

    const res = await request(app).get("/api/certifications").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.certifications)).toBe(true);
    expect(res.body.certifications.length).toBeGreaterThanOrEqual(1);
    expect(res.body.certifications.some((c) => c.name === "Listed Certification")).toBe(true);
  });

  test("paginates and rejects an out-of-range limit", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).get("/api/certifications?limit=0").set("Cookie", cookie);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/certifications/:certificationId", () => {
  test("returns 400 for a malformed certificationId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).get("/api/certifications/not-a-uuid").set("Cookie", cookie);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("returns 404 for a well-formed but nonexistent certificationId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .get("/api/certifications/00000000-0000-7000-8000-000000000099")
      .set("Cookie", cookie);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CERTIFICATION_NOT_FOUND");
  });

  test("gets a certification by id", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({ name: "Fetchable Certification" });
    const certificationId = createRes.body.certification.certificationId;

    const res = await request(app)
      .get(`/api/certifications/${certificationId}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.certification.name).toBe("Fetchable Certification");
  });
});

describe("PUT /api/certifications/:certificationId", () => {
  test("updates provided fields only", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({ name: "Original Name", issuingOrganization: "Original Org" });
    const certificationId = createRes.body.certification.certificationId;

    const res = await request(app)
      .put(`/api/certifications/${certificationId}`)
      .set("Cookie", cookie)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.certification.name).toBe("Updated Name");
    expect(res.body.certification.issuingOrganization).toBe("Original Org");
  });

  test("can explicitly clear expirationDate back to null", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({ name: "Dated Cert", issueDate: "2021-01-01", expirationDate: "2022-01-01" });
    const certificationId = createRes.body.certification.certificationId;

    const putRes = await request(app)
      .put(`/api/certifications/${certificationId}`)
      .set("Cookie", cookie)
      .send({ expirationDate: null });

    expect(putRes.status).toBe(200);
    expect(putRes.body.certification.expirationDate).toBeNull();
  });

  test("rejects an invalid date on update", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({ name: "Cert To Update" });
    const certificationId = createRes.body.certification.certificationId;

    const res = await request(app)
      .put(`/api/certifications/${certificationId}`)
      .set("Cookie", cookie)
      .send({ issueDate: "not-a-date" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("returns 404 for a nonexistent certificationId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .put("/api/certifications/00000000-0000-0000-0000-000000000000")
      .set("Cookie", cookie)
      .send({ name: "Ghost" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CERTIFICATION_NOT_FOUND");
  });

  test("returns 400 for a malformed certificationId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .put("/api/certifications/not-a-uuid")
      .set("Cookie", cookie)
      .send({ name: "Ghost" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("DELETE /api/certifications/:certificationId", () => {
  test("deletes a certification owned by the caller", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/certifications")
      .set("Cookie", cookie)
      .send({ name: "Deletable Certification" });
    const certificationId = createRes.body.certification.certificationId;

    const delRes = await request(app)
      .delete(`/api/certifications/${certificationId}`)
      .set("Cookie", cookie);
    expect(delRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/certifications/${certificationId}`)
      .set("Cookie", cookie);
    expect(getRes.status).toBe(404);
  });

  test("returns 404 deleting a nonexistent certificationId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .delete("/api/certifications/00000000-0000-0000-0000-000000000000")
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CERTIFICATION_NOT_FOUND");
  });
});

describe("ownership across users", () => {
  test("a user cannot read, update, or delete another user's certification", async () => {
    const userA = await registerLoginAndCreateProfile();
    const userB = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/certifications")
      .set("Cookie", userA.cookie)
      .send({ name: "Private Certification" });
    const certificationId = createRes.body.certification.certificationId;

    const getRes = await request(app)
      .get(`/api/certifications/${certificationId}`)
      .set("Cookie", userB.cookie);
    expect(getRes.status).toBe(404);

    const putRes = await request(app)
      .put(`/api/certifications/${certificationId}`)
      .set("Cookie", userB.cookie)
      .send({ name: "Hijacked" });
    expect(putRes.status).toBe(404);

    const delRes = await request(app)
      .delete(`/api/certifications/${certificationId}`)
      .set("Cookie", userB.cookie);
    expect(delRes.status).toBe(404);

    // Confirm User A's data is untouched.
    const stillThere = await request(app)
      .get(`/api/certifications/${certificationId}`)
      .set("Cookie", userA.cookie);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.certification.name).toBe("Private Certification");

    // User B's own list must not include User A's certification either.
    const listRes = await request(app).get("/api/certifications").set("Cookie", userB.cookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.certifications.some((c) => c.certificationId === certificationId)).toBe(
      false
    );
  });
});

describe("database unreachable", () => {
  const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;
  const UNREACHABLE_URL =
    "postgresql://clario_user:clario_dev_password@localhost:5433/clario_db";

  afterEach(() => {
    process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
  });

  test("GET /api/certifications returns a safe DATABASE_ERROR without leaking connection details", async () => {
    // Obtain a valid auth cookie against the real, working database
    // first - JWT verification never touches PostgreSQL, so the
    // resulting cookie stays valid once we swap in the unreachable
    // DATABASE_URL below.
    jest.resetModules();
    const setupRequest = require("supertest");
    const setupApp = require("../../src/app");
    const email = uniqueTestEmail();
    const password = "correct-horse-battery";

    await setupRequest(setupApp).post("/api/auth/register").send({ email, password });
    const loginRes = await setupRequest(setupApp)
      .post("/api/auth/login")
      .send({ email, password });
    const authCookie = loginRes.headers["set-cookie"];

    jest.resetModules();
    process.env.DATABASE_URL = UNREACHABLE_URL;

    const request2 = require("supertest");
    const brokenApp = require("../../src/app");
    const { pool: brokenPool } = require("../../src/config/database");

    const res = await request2(brokenApp)
      .get("/api/certifications")
      .set("Cookie", authCookie);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DATABASE_ERROR");

    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/clario_dev_password/);
    expect(raw).not.toMatch(/ECONNREFUSED/);
    expect(raw).not.toMatch(/5433/);

    await brokenPool.end();
  }, 15000);
});
