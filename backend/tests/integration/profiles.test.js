// tests/integration/profiles.test.js
//
// Exercises POST /api/profiles, GET /api/profiles/me and
// PUT /api/profiles/me against the real local PostgreSQL database.
// Every user created here uses the qa.*@clario.test email pattern, so
// afterAll() can clean up exactly the rows this suite created.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

afterAll(async () => {
  await pool.query(
    "DELETE FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test')"
  );
  await pool.query("DELETE FROM users WHERE email LIKE 'qa.%@clario.test'");
  await pool.end();
});

async function registerAndLogin() {
  const email = uniqueTestEmail();
  const password = "correct-horse-battery";

  await request(app).post("/api/auth/register").send({ email, password });
  const loginRes = await request(app).post("/api/auth/login").send({ email, password });

  return { email, cookie: loginRes.headers["set-cookie"] };
}

describe("POST /api/profiles", () => {
  test("requires authentication", async () => {
    const res = await request(app).post("/api/profiles").send({ fullName: "No Auth" });
    expect(res.status).toBe(401);
  });

  test("creates a profile owned by the authenticated user", async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .post("/api/profiles")
      .set("Cookie", cookie)
      .send({ fullName: "Ada Lovelace", fieldOfStudy: "Mathematics", region: "London" });

    expect(res.status).toBe(201);
    expect(res.body.profile).toMatchObject({
      fullName: "Ada Lovelace",
      fieldOfStudy: "Mathematics",
      region: "London",
    });
    expect(res.body.profile).not.toHaveProperty("password_hash");
  });

  test("rejects a second profile for the same user with 409", async () => {
    const { cookie } = await registerAndLogin();

    await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName: "First" });
    const res = await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName: "Second" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PROFILE_ALREADY_EXISTS");
  });

  test("rejects an overlong fullName with 400", async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .post("/api/profiles")
      .set("Cookie", cookie)
      .send({ fullName: "x".repeat(256) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/profiles/me", () => {
  test("returns 404 when the authenticated user has no profile yet", async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app).get("/api/profiles/me").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROFILE_NOT_FOUND");
  });

  test("returns only the caller's own profile, never another user's", async () => {
    const userA = await registerAndLogin();
    const userB = await registerAndLogin();

    await request(app).post("/api/profiles").set("Cookie", userA.cookie).send({ fullName: "User A" });
    await request(app).post("/api/profiles").set("Cookie", userB.cookie).send({ fullName: "User B" });

    const resA = await request(app).get("/api/profiles/me").set("Cookie", userA.cookie);
    const resB = await request(app).get("/api/profiles/me").set("Cookie", userB.cookie);

    expect(resA.body.profile.fullName).toBe("User A");
    expect(resB.body.profile.fullName).toBe("User B");
    expect(resA.body.profile.profileId).not.toBe(resB.body.profile.profileId);
  });
});

describe("PUT /api/profiles/me", () => {
  test("updates only the fields provided, leaving others untouched", async () => {
    const { cookie } = await registerAndLogin();

    await request(app)
      .post("/api/profiles")
      .set("Cookie", cookie)
      .send({ fullName: "Original Name", fieldOfStudy: "Physics", region: "Cairo" });

    const res = await request(app)
      .put("/api/profiles/me")
      .set("Cookie", cookie)
      .send({ region: "Alexandria" });

    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({
      fullName: "Original Name",
      fieldOfStudy: "Physics",
      region: "Alexandria",
    });
  });

  test("returns 404 when updating a profile that doesn't exist yet", async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app).put("/api/profiles/me").set("Cookie", cookie).send({ region: "Nowhere" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROFILE_NOT_FOUND");
  });
});
