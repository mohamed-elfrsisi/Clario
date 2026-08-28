// tests/integration/career-targets.test.js
//
// Exercises /api/career-targets and its /skills sub-resource against
// the real local PostgreSQL database. Users/skills created here use
// the qa.*@clario.test / "QA Skill CT ..." patterns so afterAll() can
// clean up exactly what this suite created.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

const QA_SKILL_PREFIX = "QA Skill CT";

function uniqueSkillName() {
  return `${QA_SKILL_PREFIX} ${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

afterAll(async () => {
  await pool.query(
    `DELETE FROM target_skills WHERE skill_id IN (SELECT skill_id FROM skills WHERE skill_name LIKE '${QA_SKILL_PREFIX}%')`
  );
  await pool.query(`DELETE FROM skills WHERE skill_name LIKE '${QA_SKILL_PREFIX}%'`);
  await pool.query(
    "DELETE FROM career_targets WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))"
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

  await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName: "CT Tester" });

  return { cookie };
}

describe("POST /api/career-targets", () => {
  test("requires authentication", async () => {
    const res = await request(app).post("/api/career-targets").send({ targetRole: "No Auth" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  test("creates a career target owned by the caller's profile", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({
        targetRole: "Senior Backend Engineer",
        targetIndustry: "Fintech",
        targetLevel: "Senior",
        targetRegion: "Remote",
        timeframe: "12 months",
        additionalNotes: "Prefer distributed teams.",
      });

    expect(res.status).toBe(201);
    expect(res.body.careerTarget).toMatchObject({
      targetRole: "Senior Backend Engineer",
      targetIndustry: "Fintech",
      targetLevel: "Senior",
      targetRegion: "Remote",
      timeframe: "12 months",
    });
    expect(res.body.careerTarget.careerTargetId).toBeDefined();
    expect(res.body.careerTarget.profileId).toBeDefined();
  });

  test("rejects a missing targetRole with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetIndustry: "Fintech" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("allows a career target with only targetRole (everything else nullable)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Minimal Target" });

    expect(res.status).toBe(201);
    expect(res.body.careerTarget.targetIndustry).toBeNull();
    expect(res.body.careerTarget.targetLevel).toBeNull();
    expect(res.body.careerTarget.targetRegion).toBeNull();
    expect(res.body.careerTarget.timeframe).toBeNull();
    expect(res.body.careerTarget.additionalNotes).toBeNull();
  });

  test("ignores unexpected fields (no mass assignment)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({
        targetRole: "Mass Assignment Test",
        careerTargetId: "00000000-0000-7000-8000-000000000099",
        profileId: "00000000-0000-7000-8000-000000000099",
        createdAt: "2000-01-01T00:00:00.000Z",
      });

    expect(res.status).toBe(201);
    expect(res.body.careerTarget.careerTargetId).not.toBe(
      "00000000-0000-7000-8000-000000000099"
    );
    expect(res.body.careerTarget.profileId).not.toBe("00000000-0000-7000-8000-000000000099");
  });
});

describe("GET /api/career-targets", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/career-targets");
    expect(res.status).toBe(401);
  });

  test("lists career targets for the caller's profile", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Listed Target" });

    const res = await request(app).get("/api/career-targets").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.careerTargets)).toBe(true);
    expect(res.body.careerTargets.some((c) => c.targetRole === "Listed Target")).toBe(true);
  });

  test("paginates and rejects an out-of-range limit", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).get("/api/career-targets?limit=0").set("Cookie", cookie);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/career-targets/:careerTargetId", () => {
  test("returns 400 for a malformed careerTargetId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).get("/api/career-targets/not-a-uuid").set("Cookie", cookie);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("returns 404 for a well-formed but nonexistent careerTargetId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .get("/api/career-targets/00000000-0000-7000-8000-000000000099")
      .set("Cookie", cookie);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CAREER_TARGET_NOT_FOUND");
  });

  test("gets a career target by id", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Fetchable Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const res = await request(app)
      .get(`/api/career-targets/${careerTargetId}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.careerTarget.targetRole).toBe("Fetchable Target");
  });
});

describe("PUT /api/career-targets/:careerTargetId", () => {
  test("updates provided fields only", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Original Role", targetIndustry: "Original Industry" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const res = await request(app)
      .put(`/api/career-targets/${careerTargetId}`)
      .set("Cookie", cookie)
      .send({ targetRole: "Updated Role" });

    expect(res.status).toBe(200);
    expect(res.body.careerTarget.targetRole).toBe("Updated Role");
    expect(res.body.careerTarget.targetIndustry).toBe("Original Industry");
  });

  test("rejects an invalid update body", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Target To Update" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const res = await request(app)
      .put(`/api/career-targets/${careerTargetId}`)
      .set("Cookie", cookie)
      .send({ targetRole: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("returns 404 for a nonexistent careerTargetId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .put("/api/career-targets/00000000-0000-0000-0000-000000000000")
      .set("Cookie", cookie)
      .send({ targetRole: "Ghost" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CAREER_TARGET_NOT_FOUND");
  });

  test("returns 400 for a malformed careerTargetId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .put("/api/career-targets/not-a-uuid")
      .set("Cookie", cookie)
      .send({ targetRole: "Ghost" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("DELETE /api/career-targets/:careerTargetId", () => {
  test("deletes a career target owned by the caller", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Deletable Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const delRes = await request(app)
      .delete(`/api/career-targets/${careerTargetId}`)
      .set("Cookie", cookie);
    expect(delRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/career-targets/${careerTargetId}`)
      .set("Cookie", cookie);
    expect(getRes.status).toBe(404);
  });

  test("returns 404 deleting a nonexistent careerTargetId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .delete("/api/career-targets/00000000-0000-0000-0000-000000000000")
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CAREER_TARGET_NOT_FOUND");
  });
});

describe("ownership across users", () => {
  test("a user cannot read, update, or delete another user's career target", async () => {
    const userA = await registerLoginAndCreateProfile();
    const userB = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", userA.cookie)
      .send({ targetRole: "Private Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const getRes = await request(app)
      .get(`/api/career-targets/${careerTargetId}`)
      .set("Cookie", userB.cookie);
    expect(getRes.status).toBe(404);

    const putRes = await request(app)
      .put(`/api/career-targets/${careerTargetId}`)
      .set("Cookie", userB.cookie)
      .send({ targetRole: "Hijacked" });
    expect(putRes.status).toBe(404);

    const delRes = await request(app)
      .delete(`/api/career-targets/${careerTargetId}`)
      .set("Cookie", userB.cookie);
    expect(delRes.status).toBe(404);

    // Confirm User A's data is untouched.
    const stillThere = await request(app)
      .get(`/api/career-targets/${careerTargetId}`)
      .set("Cookie", userA.cookie);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.careerTarget.targetRole).toBe("Private Target");

    // User B's own list must not include User A's career target either.
    const listRes = await request(app).get("/api/career-targets").set("Cookie", userB.cookie);
    expect(listRes.status).toBe(200);
    expect(
      listRes.body.careerTargets.some((c) => c.careerTargetId === careerTargetId)
    ).toBe(false);
  });

  test("a user cannot add or view skills on another user's career target", async () => {
    const userA = await registerLoginAndCreateProfile();
    const userB = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", userA.cookie)
      .send({ targetRole: "Skill Owner Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const listRes = await request(app)
      .get(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", userB.cookie);
    expect(listRes.status).toBe(404);

    const addRes = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", userB.cookie)
      .send({ skillName });
    expect(addRes.status).toBe(404);
  });
});

describe("target skills", () => {
  test("requires authentication to list, add, or remove skills", async () => {
    const listRes = await request(app).get(
      "/api/career-targets/00000000-0000-0000-0000-000000000000/skills"
    );
    expect(listRes.status).toBe(401);

    const addRes = await request(app)
      .post("/api/career-targets/00000000-0000-0000-0000-000000000000/skills")
      .send({ skillName: "No Auth Skill" });
    expect(addRes.status).toBe(401);

    const delRes = await request(app).delete(
      "/api/career-targets/00000000-0000-0000-0000-000000000000/skills/00000000-0000-0000-0000-000000000000"
    );
    expect(delRes.status).toBe(401);
  });

  test("adds a skill by name with the default importance level", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Skill Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const res = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie)
      .send({ skillName });

    expect(res.status).toBe(201);
    expect(res.body.skill.skillName).toBe(skillName);
    expect(res.body.skill.importanceLevel).toBe(3);

    const listRes = await request(app)
      .get(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.skills.map((s) => s.skillName)).toContain(skillName);
  });

  test("adds a skill by existing skillId with a custom importance level", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Skill Target By Id" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const firstAdd = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie)
      .send({ skillName, importanceLevel: 5 });
    const skillId = firstAdd.body.skill.skillId;

    const createRes2 = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Second Target" });
    const careerTargetId2 = createRes2.body.careerTarget.careerTargetId;

    const res = await request(app)
      .post(`/api/career-targets/${careerTargetId2}/skills`)
      .set("Cookie", cookie)
      .send({ skillId, importanceLevel: 2 });

    expect(res.status).toBe(201);
    expect(res.body.skill.skillId).toBe(skillId);
    expect(res.body.skill.importanceLevel).toBe(2);
  });

  test("re-adding the same skill updates importanceLevel instead of erroring (conflict path)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Conflict Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const firstAdd = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie)
      .send({ skillName, importanceLevel: 1 });
    expect(firstAdd.status).toBe(201);

    const secondAdd = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie)
      .send({ skillName, importanceLevel: 4 });

    expect(secondAdd.status).toBe(200);
    expect(secondAdd.body.skill.importanceLevel).toBe(4);

    const listRes = await request(app)
      .get(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie);
    const attached = listRes.body.skills.filter((s) => s.skillName === skillName);
    expect(attached).toHaveLength(1);
    expect(attached[0].importanceLevel).toBe(4);
  });

  test("rejects an out-of-range importanceLevel", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Bad Importance Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const res = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie)
      .send({ skillName: uniqueSkillName(), importanceLevel: 9 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects a body with both skillId and skillName, or neither", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Both Fields Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const neither = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie)
      .send({});
    expect(neither.status).toBe(400);

    const both = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie)
      .send({ skillId: "00000000-0000-0000-0000-000000000000", skillName: "Both" });
    expect(both.status).toBe(400);
  });

  test("returns 404 when adding a nonexistent skillId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Nonexistent Skill Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const res = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie)
      .send({ skillId: "00000000-0000-7000-8000-000000000099" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SKILL_NOT_FOUND");
  });

  test("returns 400 for a malformed skillId on add", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Malformed Skill Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const res = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie)
      .send({ skillId: "not-a-uuid" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("removing a skill from a career target doesn't remove it from the shared skills list", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Removable Skill Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const addRes = await request(app)
      .post(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie)
      .send({ skillName });
    const skillId = addRes.body.skill.skillId;

    const delRes = await request(app)
      .delete(`/api/career-targets/${careerTargetId}/skills/${skillId}`)
      .set("Cookie", cookie);
    expect(delRes.status).toBe(204);

    const listRes = await request(app).get("/api/skills").set("Cookie", cookie).query({ search: skillName });
    expect(listRes.body.skills.map((s) => s.skillName)).toContain(skillName);

    const targetSkillsRes = await request(app)
      .get(`/api/career-targets/${careerTargetId}/skills`)
      .set("Cookie", cookie);
    expect(targetSkillsRes.body.skills.map((s) => s.skillId)).not.toContain(skillId);
  });

  test("returns 404 removing a skill that isn't attached", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Unattached Skill Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const res = await request(app)
      .delete(`/api/career-targets/${careerTargetId}/skills/00000000-0000-7000-8000-000000000099`)
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TARGET_SKILL_NOT_FOUND");
  });

  test("returns 400 for a malformed skillId on remove", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/career-targets")
      .set("Cookie", cookie)
      .send({ targetRole: "Malformed Remove Target" });
    const careerTargetId = createRes.body.careerTarget.careerTargetId;

    const res = await request(app)
      .delete(`/api/career-targets/${careerTargetId}/skills/not-a-uuid`)
      .set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("returns 404 listing/adding skills for a nonexistent career target", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const listRes = await request(app)
      .get("/api/career-targets/00000000-0000-0000-0000-000000000000/skills")
      .set("Cookie", cookie);
    expect(listRes.status).toBe(404);

    const addRes = await request(app)
      .post("/api/career-targets/00000000-0000-0000-0000-000000000000/skills")
      .set("Cookie", cookie)
      .send({ skillName: uniqueSkillName() });
    expect(addRes.status).toBe(404);
  });
});

describe("database unreachable", () => {
  const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;
  const UNREACHABLE_URL =
    "postgresql://clario_user:clario_dev_password@localhost:5433/clario_db";

  afterEach(() => {
    process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
  });

  test("GET /api/career-targets returns a safe DATABASE_ERROR without leaking connection details", async () => {
    // Obtain a valid auth cookie against the real, working database
    // first - JWT verification never touches PostgreSQL, so the
    // resulting cookie stays valid once we swap in the unreachable
    // DATABASE_URL below.
    jest.resetModules();
    const setupRequest = require("supertest");
    const setupApp = require("../../src/app");
    const email = uniqueTestEmail();
    const password = "correct-horse-battery";

    await setupRequest(setupApp).post("/api/auth/register").send({ email, password });
    const loginRes = await setupRequest(setupApp)
      .post("/api/auth/login")
      .send({ email, password });
    const authCookie = loginRes.headers["set-cookie"];

    jest.resetModules();
    process.env.DATABASE_URL = UNREACHABLE_URL;

    const request2 = require("supertest");
    const brokenApp = require("../../src/app");
    const { pool: brokenPool } = require("../../src/config/database");

    const res = await request2(brokenApp)
      .get("/api/career-targets")
      .set("Cookie", authCookie);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("DATABASE_ERROR");

    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/clario_dev_password/);
    expect(raw).not.toMatch(/ECONNREFUSED/);
    expect(raw).not.toMatch(/5433/);

    await brokenPool.end();
  }, 15000);
});
