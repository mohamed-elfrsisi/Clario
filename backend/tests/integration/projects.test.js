// tests/integration/projects.test.js
//
// Exercises /api/projects and its /skills sub-resource against the
// real local PostgreSQL database. Users/skills created here use the
// qa.*@clario.test / "QA Skill ..." patterns so afterAll() can clean
// up exactly what this suite created.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

const QA_SKILL_PREFIX = "QA Skill Proj";

function uniqueSkillName() {
  return `${QA_SKILL_PREFIX} ${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

afterAll(async () => {
  await pool.query(
    `DELETE FROM project_skills WHERE skill_id IN (SELECT skill_id FROM skills WHERE skill_name LIKE '${QA_SKILL_PREFIX}%')`
  );
  await pool.query(`DELETE FROM skills WHERE skill_name LIKE '${QA_SKILL_PREFIX}%'`);
  await pool.query(
    "DELETE FROM projects WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))"
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

  await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName: "Project Tester" });

  return { cookie };
}

describe("GET /api/projects", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(401);
  });

  test("lists projects with default pagination", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).get("/api/projects").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.projects)).toBe(true);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });
});

describe("POST /api/projects", () => {
  test("requires authentication", async () => {
    const res = await request(app).post("/api/projects").send({ title: "No Auth" });
    expect(res.status).toBe(401);
  });

  test("creates a project owned by the caller's profile", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({
        title: "Clario Backend",
        description: "A career intelligence platform backend",
        startDate: "2026-01-01",
        endDate: "2026-06-01",
        url: "https://github.com/example/clario",
      });

    expect(res.status).toBe(201);
    expect(res.body.project).toMatchObject({
      title: "Clario Backend",
      url: "https://github.com/example/clario",
    });
  });

  test("creates a project with only the required title (dates/url are optional)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({ title: "Minimal Project" });

    expect(res.status).toBe(201);
    expect(res.body.project.title).toBe("Minimal Project");
    expect(res.body.project.startDate).toBeNull();
    expect(res.body.project.url).toBeNull();
  });

  test("rejects an endDate before startDate with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({ title: "Time Traveler", startDate: "2026-01-01", endDate: "2020-01-01" });

    expect(res.status).toBe(400);
  });

  test("rejects a missing title with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({ description: "No title here" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects a malformed url with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({ title: "Bad URL Project", url: "not a url" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("creates skills atomically with the project via skillNames", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({ title: "Full Stack Project", skillNames: [skillName] });

    expect(res.status).toBe(201);
    expect(res.body.project.skills.map((s) => s.skillName)).toContain(skillName);

    const skillsRes = await request(app)
      .get(`/api/projects/${res.body.project.projectId}/skills`)
      .set("Cookie", cookie);
    expect(skillsRes.body.skills.map((s) => s.skillName)).toContain(skillName);
  });
});

describe("ownership across users", () => {
  test("a user cannot read, update, or delete another user's project", async () => {
    const userA = await registerLoginAndCreateProfile();
    const userB = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/projects")
      .set("Cookie", userA.cookie)
      .send({ title: "Private Project" });
    const projectId = createRes.body.project.projectId;

    const getRes = await request(app).get(`/api/projects/${projectId}`).set("Cookie", userB.cookie);
    expect(getRes.status).toBe(404);

    const putRes = await request(app)
      .put(`/api/projects/${projectId}`)
      .set("Cookie", userB.cookie)
      .send({ title: "Hijacked" });
    expect(putRes.status).toBe(404);

    const delRes = await request(app).delete(`/api/projects/${projectId}`).set("Cookie", userB.cookie);
    expect(delRes.status).toBe(404);

    // Confirm User A's data is untouched.
    const stillThere = await request(app).get(`/api/projects/${projectId}`).set("Cookie", userA.cookie);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.project.title).toBe("Private Project");
  });
});

describe("GET /api/projects/:projectId", () => {
  test("returns 400 for a malformed projectId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).get("/api/projects/not-a-uuid").set("Cookie", cookie);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("returns 404 for a well-formed but nonexistent projectId", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .get("/api/projects/00000000-0000-7000-8000-000000000099")
      .set("Cookie", cookie);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });
});

describe("PUT /api/projects/:projectId", () => {
  test("can explicitly clear url back to null", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({ title: "Has A URL", url: "https://example.com" });
    const projectId = createRes.body.project.projectId;

    const putRes = await request(app)
      .put(`/api/projects/${projectId}`)
      .set("Cookie", cookie)
      .send({ url: null });

    expect(putRes.status).toBe(200);
    expect(putRes.body.project.url).toBeNull();
  });

  test("partial update leaves other fields untouched", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({ title: "Original Title", description: "Original description" });
    const projectId = createRes.body.project.projectId;

    const putRes = await request(app)
      .put(`/api/projects/${projectId}`)
      .set("Cookie", cookie)
      .send({ title: "Updated Title" });

    expect(putRes.status).toBe(200);
    expect(putRes.body.project.title).toBe("Updated Title");
    expect(putRes.body.project.description).toBe("Original description");
  });
});

describe("DELETE /api/projects/:projectId/skills/:skillId", () => {
  test("removing a skill from one project doesn't remove it from the shared skills list", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const createRes = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({ title: "Consulting Project", skillNames: [skillName] });
    const projectId = createRes.body.project.projectId;
    const skillId = createRes.body.project.skills[0].skillId;

    const delRes = await request(app)
      .delete(`/api/projects/${projectId}/skills/${skillId}`)
      .set("Cookie", cookie);
    expect(delRes.status).toBe(204);

    const listRes = await request(app).get("/api/skills").set("Cookie", cookie).query({ search: skillName });
    expect(listRes.body.skills.map((s) => s.skillName)).toContain(skillName);
  });
});

describe("DELETE /api/projects/:projectId", () => {
  test("deleting a project also removes its project_skills rows (cascade)", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const skillName = uniqueSkillName();

    const createRes = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({ title: "To Be Deleted", skillNames: [skillName] });
    const projectId = createRes.body.project.projectId;

    const delRes = await request(app).delete(`/api/projects/${projectId}`).set("Cookie", cookie);
    expect(delRes.status).toBe(204);

    const getRes = await request(app).get(`/api/projects/${projectId}`).set("Cookie", cookie);
    expect(getRes.status).toBe(404);

    const junctionRows = await pool.query(
      "SELECT * FROM project_skills WHERE project_id = $1",
      [projectId]
    );
    expect(junctionRows.rows.length).toBe(0);
  });
});
