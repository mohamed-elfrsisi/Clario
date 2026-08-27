// tests/integration/health.test.js
//
// These exercise the real Express app (src/app.js) through Supertest,
// with no mocking. GET /api/health/db and the "database reachable"
// path in these tests do talk to the real local PostgreSQL instance.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");

afterAll(async () => {
  await pool.end();
});

describe("GET /api/health", () => {
  test("returns 200 with the expected shape", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", service: "clario-backend" });
  });
});

describe("GET /api/health/db", () => {
  test("returns 200 connected when PostgreSQL is reachable", async () => {
    const res = await request(app).get("/api/health/db");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "connected" });
  });
});

describe("unknown route", () => {
  test("returns 404 with the standard NOT_FOUND shape, not an HTML page", async () => {
    const res = await request(app).get("/api/this-route-does-not-exist");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });
});

describe("GET /api/test-error (deliberate unexpected error)", () => {
  test("becomes a safe generic 500 without leaking the real error text or a stack trace", async () => {
    const res = await request(app).get("/api/test-error");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });

    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/deliberate test error/i);
    expect(res.body.error).not.toHaveProperty("stack");
  });
});
