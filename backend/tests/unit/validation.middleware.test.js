// tests/unit/validation.middleware.test.js
//
// Validation middleware is plain (req, res, next) functions - they can
// be tested directly with mocked objects, without starting Express at
// all. `next` is a jest.fn() so we can inspect what it was called with.

const {
  validateUserEmailQuery,
  validateRegistration,
  validateLogin,
} = require("../../src/middleware/validation.middleware");

function mockReqRes({ query = {}, body = {} } = {}) {
  return { req: { query, body }, res: {}, next: jest.fn() };
}

describe("validateUserEmailQuery", () => {
  test("valid email calls next() with no error and trims the value", () => {
    const { req, res, next } = mockReqRes({ query: { email: "  user@example.com  " } });
    validateUserEmailQuery(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.query.email).toBe("user@example.com");
  });

  test("missing email calls next(AppError) with VALIDATION_ERROR / 400", () => {
    const { req, res, next } = mockReqRes({ query: {} });
    validateUserEmailQuery(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("Email is required");
  });

  test("malformed email calls next(AppError) with VALIDATION_ERROR / 400", () => {
    const { req, res, next } = mockReqRes({ query: { email: "not-an-email" } });
    validateUserEmailQuery(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  test("empty string email calls next(AppError)", () => {
    const { req, res, next } = mockReqRes({ query: { email: "   " } });
    validateUserEmailQuery(req, res, next);

    expect(next.mock.calls[0][0].code).toBe("VALIDATION_ERROR");
  });
});

describe("validateRegistration", () => {
  test("valid email + password calls next() with no error", () => {
    const { req, res, next } = mockReqRes({
      body: { email: "New.User@Example.com", password: "longenough123" },
    });
    validateRegistration(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test("missing password is rejected", () => {
    const { req, res, next } = mockReqRes({ body: { email: "a@b.com" } });
    validateRegistration(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toMatch(/password/i);
  });

  test("password shorter than 8 characters is rejected", () => {
    const { req, res, next } = mockReqRes({ body: { email: "a@b.com", password: "short" } });
    validateRegistration(req, res, next);

    expect(next.mock.calls[0][0].message).toMatch(/at least 8/i);
  });

  test("password longer than 128 characters is rejected", () => {
    const { req, res, next } = mockReqRes({
      body: { email: "a@b.com", password: "x".repeat(129) },
    });
    validateRegistration(req, res, next);

    expect(next.mock.calls[0][0].message).toMatch(/128/);
  });

  test("invalid email format is rejected", () => {
    const { req, res, next } = mockReqRes({ body: { email: "nope", password: "longenough123" } });
    validateRegistration(req, res, next);

    expect(next.mock.calls[0][0].code).toBe("VALIDATION_ERROR");
  });
});

describe("validateLogin", () => {
  test("valid email + any non-empty password calls next() with no error", () => {
    const { req, res, next } = mockReqRes({ body: { email: "a@b.com", password: "x" } });
    validateLogin(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test("missing email is rejected", () => {
    const { req, res, next } = mockReqRes({ body: { password: "whatever" } });
    validateLogin(req, res, next);

    expect(next.mock.calls[0][0].code).toBe("VALIDATION_ERROR");
  });

  test("missing password is rejected", () => {
    const { req, res, next } = mockReqRes({ body: { email: "a@b.com" } });
    validateLogin(req, res, next);

    expect(next.mock.calls[0][0].code).toBe("VALIDATION_ERROR");
  });
});
