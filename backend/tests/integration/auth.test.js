// tests/integration/auth.test.js
//
// Exercises the real registration/login/me/logout flow against the
// real local PostgreSQL database. Every user created here uses the
// qa.*@clario.test email pattern (see tests/helpers/uniqueEmail.js) so
// afterAll() can clean up exactly the rows this suite created, without
// touching seed data or any other table.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
  await pool.end();
});

async function registerUser(overrides = {}) {
  const email = overrides.email || uniqueTestEmail();
  const password = overrides.password || "correct-horse-battery";
  const res = await request(app).post("/api/auth/register").send({ email, password });
  return { email, password, res };
}

async function registerAndLogin() {
  const { email, password } = await registerUser();
  const loginRes = await request(app).post("/api/auth/login").send({ email, password });
  return { email, password, cookie: loginRes.headers["set-cookie"] };
}

describe("POST /api/auth/register", () => {
  test("registers a new user and never returns password or password_hash", async () => {
    const { email, res } = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email.toLowerCase());
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("password_hash");
  });

  test("rejects a duplicate email with 409 EMAIL_ALREADY_REGISTERED", async () => {
    const email = uniqueTestEmail();
    await request(app).post("/api/auth/register").send({ email, password: "correct-horse-battery" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "a-different-password-1" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_REGISTERED");
  });

  test("rejects invalid email format with 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "correct-horse-battery" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: uniqueTestEmail(), password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/at least 8/i);
  });

  test("rejects a missing password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: uniqueTestEmail() });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  test("logs in with valid credentials, sets an HttpOnly cookie, and never returns the token in JSON", async () => {
    const { email, password } = await registerUser();

    const res = await request(app).post("/api/auth/login").send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email.toLowerCase());
    expect(res.body).not.toHaveProperty("token");
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("password_hash");

    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    const cookieStr = setCookie.join(";");
    expect(cookieStr).toMatch(/clario_access=/);
    expect(cookieStr.toLowerCase()).toMatch(/httponly/);
  });

  test("rejects the wrong password with 401 INVALID_CREDENTIALS", async () => {
    const { email } = await registerUser();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "totally-the-wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  test("rejects an unknown email with the SAME error as a wrong password (no user enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueTestEmail(), password: "whatever-123" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.error.message).toBe("Invalid email or password");
  });
});

describe("GET /api/auth/me", () => {
  test("rejects a request with no auth cookie", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  test("rejects an invalid/garbage token", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", "clario_access=not-a-real-token");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  test("returns the authenticated user's own data for a valid session", async () => {
    const { email, cookie } = await registerAndLogin();

    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email.toLowerCase());
    expect(res.body.user).not.toHaveProperty("password_hash");
  });

  test("two different authenticated users each get back only their own identity", async () => {
    const userA = await registerAndLogin();
    const userB = await registerAndLogin();

    const resA = await request(app).get("/api/auth/me").set("Cookie", userA.cookie);
    const resB = await request(app).get("/api/auth/me").set("Cookie", userB.cookie);

    expect(resA.body.user.email).toBe(userA.email.toLowerCase());
    expect(resB.body.user.email).toBe(userB.email.toLowerCase());
    expect(resA.body.user.email).not.toBe(resB.body.user.email);
  });
});

describe("POST /api/auth/logout", () => {
  test("clears the auth cookie and returns 204 with no body", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(204);
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    expect(setCookie.join(";")).toMatch(/clario_access=;/);
  });
});
