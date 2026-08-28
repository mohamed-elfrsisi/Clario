// tests/integration/users.test.js
//
// Exercises GET /api/db/users/count and GET /api/db/users/by-email
// against the real local PostgreSQL database and its existing seed
// rows (mohamed.test@clario.local, admin@clario.local). Does not
// create or delete any data (beyond the one QA account this suite
// registers to authenticate with), so no seed-data cleanup is needed.
//
// SECURITY (Phase 8): both endpoints used to be reachable without any
// authentication, which let anyone enumerate registered emails/roles.
// They now require a valid session, so every test here logs in first
// and sends the resulting auth cookie. See also
// tests/integration/users.security.test.js for the tests that assert
// the *unauthenticated* paths are correctly rejected.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

let authCookie;

beforeAll(async () => {
  const email = uniqueTestEmail();
  const password = "correct-horse-battery";

  await request(app).post("/api/auth/register").send({ email, password });
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  authCookie = loginRes.headers["set-cookie"];
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
  await pool.end();
});

describe("GET /api/db/users/count", () => {
  test("returns a numeric count backed by the real database when authenticated", async () => {
    const res = await request(app)
      .get("/api/db/users/count")
      .set("Cookie", authCookie);

    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe("number");
    // At minimum the two seed users created for earlier phases.
    expect(res.body.count).toBeGreaterThanOrEqual(2);
  });
});

describe("GET /api/db/users/by-email", () => {
  test("returns only safe fields for a known user when authenticated", async () => {
    const res = await request(app)
      .get("/api/db/users/by-email")
      .set("Cookie", authCookie)
      .query({ email: "dev.seed.user@clario.test" });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: "dev.seed.user@clario.test",
      role: "user",
    });
    expect(res.body.user).not.toHaveProperty("password_hash");
  });

  test("returns 404 USER_NOT_FOUND for a well-formed but unknown email", async () => {
    const res = await request(app)
      .get("/api/db/users/by-email")
      .set("Cookie", authCookie)
      .query({ email: "definitely.not.a.real.user@clario.local" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: "USER_NOT_FOUND", message: "User not found" },
    });
  });

  test("returns 400 VALIDATION_ERROR when email is missing", async () => {
    const res = await request(app)
      .get("/api/db/users/by-email")
      .set("Cookie", authCookie);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBe("Email is required");
  });

  test("returns 400 VALIDATION_ERROR for an obviously malformed email", async () => {
    const res = await request(app)
      .get("/api/db/users/by-email")
      .set("Cookie", authCookie)
      .query({ email: "hello" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("a classic injection payload with spaces/quotes fails validation before it ever reaches SQL", async () => {
    const res = await request(app)
      .get("/api/db/users/by-email")
      .set("Cookie", authCookie)
      .query({ email: "' OR '1'='1" });

    // This shape doesn't even look like an email, so it's rejected by
    // validation before the repository runs any query - defense in depth.
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("an injection-shaped value that DOES pass email format validation is still safely parameterized", async () => {
    // No whitespace, exactly one @, and a dot in the domain part - this
    // clears the regex and reaches the repository's pool.query() call.
    // If parameterization ever broke, this could return every user
    // instead of a clean 404.
    const res = await request(app)
      .get("/api/db/users/by-email")
      .set("Cookie", authCookie)
      .query({ email: "a'or'1'='1@example.com" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });
});
