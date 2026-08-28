// tests/integration/experiences.test.js
//
// Exercises /api/experiences and its /skills sub-resource against the
// real local PostgreSQL database. Users/skills created here use the
// qa.*@clario.test / "QA Skill ..." patterns so afterAll() can clean
// up exactly what this suite created.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

const QA_SKILL_PREFIX = "QA Skill Exp";

function uniqueSkillName() {
  return `${QA_SKILL_PREFIX} ${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

afterAll(async () => {
  await pool.query(
    `DELETE FROM experience_skills WHERE skill_id IN (SELECT skill_id FROM skills WHERE skill_name LIKE '${QA_SKILL_PREFIX}%')`
  );
  await pool.query(`DELETE FROM skills WHERE skill_name LIKE '${QA_SKILL_PREFIX}%'`);
  await pool.query(
    "DELETE FROM experiences WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))"
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

  await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName: "Exp Tester" });

  return { cookie };
}

describe("POST /api/experiences", () => {
  test("requires authentication", async () => {
    const res = await request(app).post("/api/experiences").send({ title: "No Auth", startDate: "2020-01-01" });
    expect(res.status).toBe(401);
  });

  test("creates an experience owned by the caller's profile", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/experiences")
      .set("Cookie", cookie)
      .send({ title: "Backend Engineer", company: "Acme", startDate: "2021-01-01", endDate: "2023-06-01" });

    expect(res.status).toBe(201);
    expect(res.body.experience).toMatchObject({
      title: "Backend Engineer",
      company: "Acme",
    });
  });

  test("rejects an endDate before startDate with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/experiences")
      .set("Cookie", cookie)
      .send({ title: "Time Traveler", startDate: "2023-01-01", endDate: "2020-01-01" });

    expect(res.status).toBe(400);
  });

  test("rejects a missing title with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/experiences")
      .set("Cookie", cookie)
      .send({ startDate: "2021-01-01" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("creates skills atomically with the experience via skillNames", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const res = await request(app)
      .post("/api/experiences")
      .set("Cookie", cookie)
      .send({ title: "Full Stack Dev", startDate: "2022-01-01", skillNames: [skillName] });

    expect(res.status).toBe(201);
    expect(res.body.experience.skills.map((s) => s.skillName)).toContain(skillName);

    const skillsRes = await request(app)
      .get(`/api/experiences/${res.body.experience.experienceId}/skills`)
      .set("Cookie", cookie);
    expect(skillsRes.body.skills.map((s) => s.skillName)).toContain(skillName);
  });
});

describe("ownership across users", () => {
  test("a user cannot read, update, or delete another user's experience", async () => {
    const userA = await registerLoginAndCreateProfile();
    const userB = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/experiences")
      .set("Cookie", userA.cookie)
      .send({ title: "Private Role", startDate: "2020-01-01" });
    const experienceId = createRes.body.experience.experienceId;

    const getRes = await request(app).get(`/api/experiences/${experienceId}`).set("Cookie", userB.cookie);
    expect(getRes.status).toBe(404);

    const putRes = await request(app)
      .put(`/api/experiences/${experienceId}`)
      .set("Cookie", userB.cookie)
      .send({ title: "Hijacked" });
    expect(putRes.status).toBe(404);

    const delRes = await request(app).delete(`/api/experiences/${experienceId}`).set("Cookie", userB.cookie);
    expect(delRes.status).toBe(404);

    // Confirm User A's data is untouched.
    const stillThere = await request(app).get(`/api/experiences/${experienceId}`).set("Cookie", userA.cookie);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.experience.title).toBe("Private Role");
  });
});

describe("PUT /api/experiences/:experienceId", () => {
  test("can explicitly clear endDate back to null (ongoing role)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/experiences")
      .set("Cookie", cookie)
      .send({ title: "Contractor", startDate: "2021-01-01", endDate: "2022-01-01" });
    const experienceId = createRes.body.experience.experienceId;

    const putRes = await request(app)
      .put(`/api/experiences/${experienceId}`)
      .set("Cookie", cookie)
      .send({ endDate: null });

    expect(putRes.status).toBe(200);
    expect(putRes.body.experience.endDate).toBeNull();
  });
});

describe("DELETE /api/experiences/:experienceId/skills/:skillId", () => {
  test("removing a skill from one experience doesn't remove it from the shared skills list", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const createRes = await request(app)
      .post("/api/experiences")
      .set("Cookie", cookie)
      .send({ title: "Consultant", startDate: "2022-01-01", skillNames: [skillName] });
    const experienceId = createRes.body.experience.experienceId;
    const skillId = createRes.body.experience.skills[0].skillId;

    const delRes = await request(app)
      .delete(`/api/experiences/${experienceId}/skills/${skillId}`)
      .set("Cookie", cookie);
    expect(delRes.status).toBe(204);

    const listRes = await request(app).get("/api/skills").set("Cookie", cookie).query({ search: skillName });
    expect(listRes.body.skills.map((s) => s.skillName)).toContain(skillName);
  });
});
