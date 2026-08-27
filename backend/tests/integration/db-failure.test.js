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
    jest.resetModules();
    process.env.DATABASE_URL = UNREACHABLE_URL;

    const request = require("supertest");
    const app = require("../../src/app");
    const { pool } = require("../../src/config/database");

    const res = await request(app).get("/api/db/users/count");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DATABASE_ERROR");
    expect(JSON.stringify(res.body)).not.toMatch(/clario_dev_password/);

    await pool.end();
  }, 15000);
});
