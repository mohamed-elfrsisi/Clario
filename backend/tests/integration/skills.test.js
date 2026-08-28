// tests/integration/skills.test.js
//
// Exercises GET /api/skills and the /api/profiles/me/skills
// sub-resource against the real local PostgreSQL database.
// Skills created here use a QA-prefixed name so afterAll() can clean
// up exactly what this suite created without touching seed skills.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

const QA_SKILL_PREFIX = "QA Skill";

function uniqueSkillName() {
  return `${QA_SKILL_PREFIX} ${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

afterAll(async () => {
  await pool.query(
    `DELETE FROM profile_skills WHERE skill_id IN (SELECT skill_id FROM skills WHERE skill_name LIKE '${QA_SKILL_PREFIX}%')`
  );
  await pool.query(`DELETE FROM skills WHERE skill_name LIKE '${QA_SKILL_PREFIX}%'`);
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

  await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName: "Skill Tester" });

  return { cookie };
}

describe("GET /api/skills", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/skills");
    expect(res.status).toBe(401);
  });

  test("lists skills with default pagination", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).get("/api/skills").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.skills)).toBe(true);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });

  test("rejects a limit above the allowed maximum", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).get("/api/skills?limit=500").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/profiles/me/skills", () => {
  test("creates a new shared skill by name and attaches it to the caller's profile", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const res = await request(app)
      .post("/api/profiles/me/skills")
      .set("Cookie", cookie)
      .send({ skillName });

    expect(res.status).toBe(201);
    expect(res.body.skill.skillName).toBe(skillName);

    const listRes = await request(app).get("/api/profiles/me/skills").set("Cookie", cookie);
    expect(listRes.body.skills.map((s) => s.skillName)).toContain(skillName);
  });

  test("rejects a body with both skillId and skillName", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/profiles/me/skills")
      .set("Cookie", cookie)
      .send({ skillId: "00000000-0000-0000-0000-000000000000", skillName: "X" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects a well-formed but unknown skillId with 404", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/profiles/me/skills")
      .set("Cookie", cookie)
      .send({ skillId: "00000000-0000-0000-0000-000000000000" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SKILL_NOT_FOUND");
  });
});

describe("DELETE /api/profiles/me/skills/:skillId", () => {
  test("removes a skill from the caller's own profile", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const addRes = await request(app)
      .post("/api/profiles/me/skills")
      .set("Cookie", cookie)
      .send({ skillName });
    const { skillId } = addRes.body.skill;

    const delRes = await request(app).delete(`/api/profiles/me/skills/${skillId}`).set("Cookie", cookie);
    expect(delRes.status).toBe(204);

    const listRes = await request(app).get("/api/profiles/me/skills").set("Cookie", cookie);
    expect(listRes.body.skills.map((s) => s.skillId)).not.toContain(skillId);
  });

  test("cannot remove a skill belonging to another user's profile", async () => {
    const userA = await registerLoginAndCreateProfile();
    const userB = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const addRes = await request(app)
      .post("/api/profiles/me/skills")
      .set("Cookie", userA.cookie)
      .send({ skillName });
    const { skillId } = addRes.body.skill;

    // User B never attached this skill, so the relation doesn't exist
    // for them - deleting it must fail rather than silently succeed
    // or reach into User A's data.
    const res = await request(app).delete(`/api/profiles/me/skills/${skillId}`).set("Cookie", userB.cookie);
    expect(res.status).toBe(404);

    // Confirm it's still attached to User A.
    const listRes = await request(app).get("/api/profiles/me/skills").set("Cookie", userA.cookie);
    expect(listRes.body.skills.map((s) => s.skillId)).toContain(skillId);
  });

  test("rejects a malformed skillId with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).delete("/api/profiles/me/skills/not-a-uuid").set("Cookie", cookie);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
