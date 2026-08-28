// tests/integration/documents.test.js
//
// Exercises /api/documents against the real local PostgreSQL
// database. This backend has no object storage integration, so these
// tests only ever exercise metadata rows - object_key is an arbitrary
// opaque string, never a real uploaded file.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/database");
const { uniqueTestEmail } = require("../helpers/uniqueEmail");

afterAll(async () => {
  await pool.query(
    "DELETE FROM documents WHERE profile_id IN (SELECT profile_id FROM profiles WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE 'qa.%@clario.test'))"
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

  await request(app).post("/api/profiles").set("Cookie", cookie).send({ fullName: "Doc Tester" });

  return { cookie };
}

function sampleDocument(overrides = {}) {
  return {
    fileName: "resume.pdf",
    objectKey: `qa-test/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
    mimeType: "application/pdf",
    fileSizeBytes: 102400,
    ...overrides,
  };
}

describe("POST /api/documents", () => {
  test("requires authentication", async () => {
    const res = await request(app).post("/api/documents").send(sampleDocument());
    expect(res.status).toBe(401);
  });

  test("creates a document metadata row owned by the caller's profile", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app).post("/api/documents").set("Cookie", cookie).send(sampleDocument());

    expect(res.status).toBe(201);
    expect(res.body.document).toMatchObject({
      fileName: "resume.pdf",
      mimeType: "application/pdf",
      versionNumber: 1,
      scanStatus: "pending",
    });
    expect(res.body.document.rawText).toBeNull();
  });

  test("rejects a missing objectKey with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();
    const body = sampleDocument();
    delete body.objectKey;

    const res = await request(app).post("/api/documents").set("Cookie", cookie).send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("rejects a malformed checksumSha256 with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/documents")
      .set("Cookie", cookie)
      .send(sampleDocument({ checksumSha256: "not-a-real-checksum" }));

    expect(res.status).toBe(400);
  });

  test("rejects an oversized fileSizeBytes with 400", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/documents")
      .set("Cookie", cookie)
      .send(sampleDocument({ fileSizeBytes: 999 * 1024 * 1024 }));

    expect(res.status).toBe(400);
  });

  test("ignores client-supplied scanStatus/rawText/versionNumber - none are settable", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const res = await request(app)
      .post("/api/documents")
      .set("Cookie", cookie)
      .send(sampleDocument({ scanStatus: "clean", rawText: "fabricated text", versionNumber: 99 }));

    expect(res.status).toBe(201);
    expect(res.body.document.scanStatus).toBe("pending");
    expect(res.body.document.rawText).toBeNull();
    expect(res.body.document.versionNumber).toBe(1);
  });
});

describe("document versioning", () => {
  test("a new version computes version_number from its parent and requires the parent be owned", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const v1Res = await request(app).post("/api/documents").set("Cookie", cookie).send(sampleDocument());
    const parentId = v1Res.body.document.documentId;

    const v2Res = await request(app)
      .post("/api/documents")
      .set("Cookie", cookie)
      .send(sampleDocument({ parentDocumentId: parentId }));

    expect(v2Res.status).toBe(201);
    expect(v2Res.body.document.versionNumber).toBe(2);
    expect(v2Res.body.document.parentDocumentId).toBe(parentId);
  });

  test("cannot chain a new version off another user's document", async () => {
    const userA = await registerLoginAndCreateProfile();
    const userB = await registerLoginAndCreateProfile();

    const v1Res = await request(app).post("/api/documents").set("Cookie", userA.cookie).send(sampleDocument());
    const parentId = v1Res.body.document.documentId;

    const res = await request(app)
      .post("/api/documents")
      .set("Cookie", userB.cookie)
      .send(sampleDocument({ parentDocumentId: parentId }));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PARENT_DOCUMENT_NOT_FOUND");
  });

  test("cannot delete a document that is the parent of a newer version", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const v1Res = await request(app).post("/api/documents").set("Cookie", cookie).send(sampleDocument());
    const parentId = v1Res.body.document.documentId;
    await request(app)
      .post("/api/documents")
      .set("Cookie", cookie)
      .send(sampleDocument({ parentDocumentId: parentId }));

    const delRes = await request(app).delete(`/api/documents/${parentId}`).set("Cookie", cookie);

    expect(delRes.status).toBe(409);
    expect(delRes.body.error.code).toBe("DOCUMENT_HAS_NEWER_VERSIONS");
  });
});

describe("ownership across users", () => {
  test("a user cannot read, update, or delete another user's document", async () => {
    const userA = await registerLoginAndCreateProfile();
    const userB = await registerLoginAndCreateProfile();

    const createRes = await request(app)
      .post("/api/documents")
      .set("Cookie", userA.cookie)
      .send(sampleDocument());
    const documentId = createRes.body.document.documentId;

    const getRes = await request(app).get(`/api/documents/${documentId}`).set("Cookie", userB.cookie);
    expect(getRes.status).toBe(404);

    const putRes = await request(app)
      .put(`/api/documents/${documentId}`)
      .set("Cookie", userB.cookie)
      .send({ fileName: "hijacked.pdf" });
    expect(putRes.status).toBe(404);

    const delRes = await request(app).delete(`/api/documents/${documentId}`).set("Cookie", userB.cookie);
    expect(delRes.status).toBe(404);
  });
});

describe("PUT /api/documents/:documentId", () => {
  test("updates only fileName/documentType, never objectKey or mimeType", async () => {
    const { cookie } = await registerLoginAndCreateProfile();

    const createRes = await request(app).post("/api/documents").set("Cookie", cookie).send(sampleDocument());
    const documentId = createRes.body.document.documentId;
    const originalObjectKey = createRes.body.document.objectKey;

    const putRes = await request(app)
      .put(`/api/documents/${documentId}`)
      .set("Cookie", cookie)
      .send({ fileName: "resume-v2.pdf", objectKey: "attempted-hijack", mimeType: "text/plain" });

    expect(putRes.status).toBe(200);
    expect(putRes.body.document.fileName).toBe("resume-v2.pdf");
    expect(putRes.body.document.objectKey).toBe(originalObjectKey);
    expect(putRes.body.document.mimeType).toBe("application/pdf");
  });
});
