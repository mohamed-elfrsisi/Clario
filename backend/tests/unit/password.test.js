// tests/unit/password.test.js
//
// Unit tests for src/utils/password.js. No Express, no database - pure
// function behavior. These are the properties that matter most for a
// password hash: it verifies the right password, it rejects the wrong
// one, it never produces the same output twice (random salt), and it
// fails safely instead of throwing on malformed input.

const { hashPassword, verifyPassword } = require("../../src/utils/password");

describe("hashPassword / verifyPassword", () => {
  test("a hashed password verifies successfully against the original", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(
      verifyPassword("correct-horse-battery-staple", hash)
    ).resolves.toBe(true);
  });

  test("verification fails for an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  test("hashing the same password twice produces different hashes (random salt)", async () => {
    const hashA = await hashPassword("same-password-both-times");
    const hashB = await hashPassword("same-password-both-times");
    expect(hashA).not.toEqual(hashB);
  });

  test("verifyPassword returns false (not throws) for a malformed stored hash", async () => {
    await expect(verifyPassword("anything", "not-a-real-hash")).resolves.toBe(
      false
    );
  });

  test("verifyPassword returns false for an empty stored hash", async () => {
    await expect(verifyPassword("anything", "")).resolves.toBe(false);
  });
});
