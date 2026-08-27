// tests/integration/security.test.js
//
// Phase 8 security regression tests. These assert the fixes made
// during this phase actually hold, so future changes can't silently
// reopen them:
//
//   1. The user-lookup endpoints reject unauthenticated requests
//      (previously anyone could enumerate registered emails/roles).
//   2. Protected endpoints reject garbage/invalid tokens, not just
//      missing ones.
//   3. Standard security headers (from helmet) are present.
//   4. The JSON body size limit rejects oversized payloads.
//   5. Login does not leak whether an email is registered via the
//      response body OR response status - both unknown-email and
//      wrong-password attempts return the same 401/INVALID_CREDENTIALS.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
  await pool.end();
});

describe("Unauthenticated access to user-lookup endpoints", () => {
  test("GET /api/db/users/count without a session returns 401", async () => {
    const res = await request(app).get("/api/db/users/count");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  test("GET /api/db/users/by-email without a session returns 401, not user data", async () => {
    const res = await request(app)
      .get("/api/db/users/by-email")
      .query({ email: "mohamed.test@clario.local" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
    expect(res.body).not.toHaveProperty("user");
  });
});

describe("Invalid/tampered authentication", () => {
  test("a garbage cookie value is rejected the same way a missing cookie is", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "clario_access=not-a-real-jwt");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});

describe("Security headers", () => {
  test("responses include standard hardening headers from helmet", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers).toHaveProperty("content-security-policy");
    // Helmet removes the framework-fingerprinting header by default.
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("Request body size limit", () => {
  test("an oversized JSON body is rejected instead of processed", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: uniqueTestEmail(),
        password: "correct-horse-battery",
        // Comfortably over the 100kb express.json() limit.
        padding: "x".repeat(200 * 1024),
      });

    expect(res.status).toBe(413);
  });
});

describe("Login does not reveal whether an email is registered", () => {
  test("unknown email and a known email with the wrong password return identical error shapes", async () => {
    const { email: knownEmail } = await (async () => {
      const email = uniqueTestEmail();
      await request(app)
        .post("/api/auth/register")
        .send({ email, password: "correct-horse-battery" });
      return { email };
    })();

    const unknownEmailRes = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueTestEmail(), password: "correct-horse-battery" });

    const wrongPasswordRes = await request(app)
      .post("/api/auth/login")
      .send({ email: knownEmail, password: "totally-wrong-password" });

    expect(unknownEmailRes.status).toBe(wrongPasswordRes.status);
    expect(unknownEmailRes.body).toEqual(wrongPasswordRes.body);
    expect(unknownEmailRes.status).toBe(401);
    expect(unknownEmailRes.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});
