// tests/unit/app-error.test.js

const AppError = require("../../src/errors/app-error");

describe("AppError", () => {
  test("carries statusCode, code, and message, and is a real Error", () => {
    const err = new AppError(404, "USER_NOT_FOUND", "User not found");

    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("USER_NOT_FOUND");
    expect(err.message).toBe("User not found");
  });
});
