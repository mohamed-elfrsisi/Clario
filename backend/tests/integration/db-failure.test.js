// tests/integration/db-failure.test.js
//
// Simulates PostgreSQL being unreachable by pointing DATABASE_URL at a
// port nothing is listening on, then requiring a fresh copy of the app
// (jest.resetModules()) so it builds a new Pool against that bad URL.
// This never touches the real database or its data - it only proves
// that a connection failure degrades safely instead of leaking
// internals to the client.

describe("database unreachable", () => {
  const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;
  const UNREACHABLE_URL =
    "postgresql://clario_user:clario_dev_password@localhost:5433/clario_db";

  afterEach(() => {
    process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
  });

  afterAll(async () => {
    // The test above registers one qa.*@clario.test user against the
    // real database purely to obtain an auth cookie. Clean it up the
    // same way the other integration suites clean up their own rows.
    jest.resetModules();
    process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
    const { pool } = require("../../src/config/database");
    await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
    await pool.end();
  });

  test("GET /api/health/db returns a safe DATABASE_ERROR without leaking connection details", async () => {
    jest.resetModules();
    process.env.DATABASE_URL = UNREACHABLE_URL;

    const request = require("supertest");
    const app = require("../../src/app");
    const { pool } = require("../../src/config/database");

    const res = await request(app).get("/api/health/db");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: "DATABASE_ERROR", message: "Database operation failed" },
    });

    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/clario_dev_password/);
    expect(raw).not.toMatch(/ECONNREFUSED/);
    expect(raw).not.toMatch(/5433/);
    expect(raw).not.toMatch(/localhost/);

    await pool.end();
  }, 15000);

  test("GET /api/db/users/count returns a safe DATABASE_ERROR when PostgreSQL is unreachable", async () => {
    // SECURITY (Phase 8): this endpoint now requires authentication, so
    // we need a valid session cookie before we can even reach the code
    // path that talks to the database. We get one against the real,
    // working database first - JWT verification itself never touches
    // PostgreSQL, so the resulting cookie stays valid once we swap in
    // the unreachable DATABASE_URL below.
    //
    // The previous test already left a fresh, unreachable-DB-bound
    // `src/app` module in Jest's require cache, so we must reset the
    // module registry before requiring app.js here, or this setup
    // step would silently reuse that broken pool too.
    jest.resetModules();

    const { uniqueTestEmail } = require("../helpers/uniqueEmail");
    const setupRequest = require("supertest");
    const setupApp = require("../../src/app");
    const email = uniqueTestEmail();
    const password = "correct-horse-battery";

    await setupRequest(setupApp)
      .post("/api/auth/register")
      .send({ email, password });
    const loginRes = await setupRequest(setupApp)
      .post("/api/auth/login")
      .send({ email, password });
    const authCookie = loginRes.headers["set-cookie"];

    jest.resetModules();
    process.env.DATABASE_URL = UNREACHABLE_URL;

    const request = require("supertest");
    const app = require("../../src/app");
    const { pool } = require("../../src/config/database");

    const res = await request(app)
      .get("/api/db/users/count")
      .set("Cookie", authCookie);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DATABASE_ERROR");
    expect(JSON.stringify(res.body)).not.toMatch(/clario_dev_password/);

    await pool.end();
  }, 15000);
});
