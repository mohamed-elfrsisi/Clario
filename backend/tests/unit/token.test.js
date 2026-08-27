// tests/unit/token.test.js
//
// Unit tests for src/utils/token.js. Sets its own JWT_SECRET so this
// suite doesn't depend on .env - it should pass in any environment.

process.env.JWT_SECRET = "unit_test_secret_at_least_32_characters_long";
process.env.ACCESS_TOKEN_TTL = "1h";

const jwt = require("jsonwebtoken");
const { createAccessToken, verifyAccessToken } = require("../../src/utils/token");

const fakeUser = { user_id: 42, email: "qa.token@clario.test", role: "student" };

describe("createAccessToken / verifyAccessToken", () => {
  test("a created token verifies and carries the expected claims", () => {
    const token = createAccessToken(fakeUser);
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe(fakeUser.user_id);
    expect(payload.email).toBe(fakeUser.email);
    expect(payload.role).toBe(fakeUser.role);
  });

  test("a tampered token fails verification", () => {
    const token = createAccessToken(fakeUser);
    const tampered = token.slice(0, -2) + (token.slice(-2) === "aa" ? "bb" : "aa");

    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  test("a token signed with a different secret is rejected", () => {
    const foreignToken = jwt.sign({ sub: 1 }, "a-totally-different-secret-value", {
      issuer: "clario-api",
      audience: "clario-web",
    });

    expect(() => verifyAccessToken(foreignToken)).toThrow();
  });

  test("a token with the wrong audience/issuer is rejected", () => {
    const wrongAudienceToken = jwt.sign(
      { sub: 1 },
      "unit_test_secret_at_least_32_characters_long",
      { issuer: "clario-api", audience: "some-other-app" }
    );

    expect(() => verifyAccessToken(wrongAudienceToken)).toThrow();
  });
});
