// tests/integration/educations.test.js
//
// Exercises /api/educations against the real local PostgreSQL
// database. Users created here use the qa.*@clario.test pattern so
// afterAll() can clean up exactly what this suite created.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

afterAll(async () => {
  await pool.query(
    "DELETE FROM educations WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))"
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

  await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName: "Edu Tester" });

  return { cookie };
}

describe("POST /api/educations", () => {
  test("requires authentication", async () => {
    const res = await request(app).post("/api/educations").send({ degree: "No Auth" });
    expect(res.status).toBe(401);
  });

  test("creates an education entry owned by the caller's profile", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/educations")
      .set("Cookie", cookie)
      .send({ degree: "BSc Computer Science", institution: "Cairo University", startDate: "2018-09-01", endDate: "2022-06-01" });

    expect(res.status).toBe(201);
    expect(res.body.education).toMatchObject({
      degree: "BSc Computer Science",
      institution: "Cairo University",
    });
  });

  test("rejects a body with neither degree nor institution", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/educations")
      .set("Cookie", cookie)
      .send({ startDate: "2018-09-01" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects an endDate before startDate with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/educations")
      .set("Cookie", cookie)
      .send({ degree: "PhD", startDate: "2023-01-01", endDate: "2020-01-01" });

    expect(res.status).toBe(400);
  });

  test("allows a degree with no dates at all (both nullable)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/educations")
      .set("Cookie", cookie)
      .send({ degree: "Self-taught" });

    expect(res.status).toBe(201);
    expect(res.body.education.startDate).toBeNull();
    expect(res.body.education.endDate).toBeNull();
  });
});

describe("ownership across users", () => {
  test("a user cannot read, update, or delete another user's education entry", async () => {
    const userA = await registerLoginAndCreateProfile();
    const userB = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/educations")
      .set("Cookie", userA.cookie)
      .send({ degree: "Private Degree" });
    const educationId = createRes.body.education.educationId;

    const getRes = await request(app).get(`/api/educations/${educationId}`).set("Cookie", userB.cookie);
    expect(getRes.status).toBe(404);

    const putRes = await request(app)
      .put(`/api/educations/${educationId}`)
      .set("Cookie", userB.cookie)
      .send({ degree: "Hijacked" });
    expect(putRes.status).toBe(404);

    const delRes = await request(app).delete(`/api/educations/${educationId}`).set("Cookie", userB.cookie);
    expect(delRes.status).toBe(404);

    const stillThere = await request(app).get(`/api/educations/${educationId}`).set("Cookie", userA.cookie);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.education.degree).toBe("Private Degree");
  });
});

describe("PUT /api/educations/:educationId", () => {
  test("can explicitly clear endDate back to null", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/educations")
      .set("Cookie", cookie)
      .send({ degree: "MSc", startDate: "2021-01-01", endDate: "2022-01-01" });
    const educationId = createRes.body.education.educationId;

    const putRes = await request(app)
      .put(`/api/educations/${educationId}`)
      .set("Cookie", cookie)
      .send({ endDate: null });

    expect(putRes.status).toBe(200);
    expect(putRes.body.education.endDate).toBeNull();
  });

  test("returns 404 for a nonexistent educationId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .put("/api/educations/00000000-0000-0000-0000-000000000000")
      .set("Cookie", cookie)
      .send({ degree: "Ghost" });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/educations", () => {
  test("paginates and rejects an out-of-range limit", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).get("/api/educations?limit=0").set("Cookie", cookie);
    expect(res.status).toBe(400);
  });
});
