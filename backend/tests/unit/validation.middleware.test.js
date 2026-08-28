// tests/unit/validation.middleware.test.js
//
// Validation middleware is plain (req, res, next) functions - they can
// be tested directly with mocked objects, without starting Express at
// all. `next` is a jest.fn() so we can inspect what it was called with.

const {
  validateUserEmailQuery,
  validateRegistration,
  validateLogin,
  validatePaginationQuery,
} = require("../../src/middleware/validation.middleware");

function mockReqRes({ query = {}, body = {} } = {}) {
  return { req: { query, body }, res: {}, next: jest.fn() };
}

describe("validateUserEmailQuery", () => {
  test("valid email calls next() with no error and stores the trimmed value on req.validatedQuery", () => {
    const { req, res, next } = mockReqRes({ query: { email: "  user@example.com  " } });
    validateUserEmailQuery(req, res, next);

    expect(next).toHaveBeenCalledWith();
    // PHASE 9 REGRESSION TEST: this must be req.validatedQuery, not
    // req.query - in real Express 5, req.query is a getter that
    // re-parses the URL on every access, so writes to req.query
    // silently vanish before a controller can read them back. This
    // caused real 500s on every paginated list endpoint (skills,
    // experiences, educations, documents) until fixed.
    expect(req.validatedQuery.email).toBe("user@example.com");
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

describe("validatePaginationQuery", () => {
  test("defaults page=1 and limit=20 onto req.validatedQuery when neither is provided", () => {
    const { req, res, next } = mockReqRes({ query: {} });
    validatePaginationQuery(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validatedQuery).toEqual({ page: 1, limit: 20 });
  });

  test("parses and stores valid page/limit query strings as numbers", () => {
    const { req, res, next } = mockReqRes({ query: { page: "3", limit: "50" } });
    validatePaginationQuery(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validatedQuery).toEqual({ page: 3, limit: 50 });
  });

  test("rejects a limit above 100", () => {
    const { req, res, next } = mockReqRes({ query: { limit: "500" } });
    validatePaginationQuery(req, res, next);

    expect(next.mock.calls[0][0].code).toBe("VALIDATION_ERROR");
  });

  test("rejects a non-integer page", () => {
    const { req, res, next } = mockReqRes({ query: { page: "abc" } });
    validatePaginationQuery(req, res, next);

    expect(next.mock.calls[0][0].code).toBe("VALIDATION_ERROR");
  });
});
