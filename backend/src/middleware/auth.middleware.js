const AppError = require('../errors/app-error');
const { getAuthToken } = require('../utils/auth-cookie');
const { verifyAccessToken } = require('../utils/token');

function requireAuth(req, res, next) {
  const token = getAuthToken(req);

  if (!token) {
    return next(
      new AppError(401, 'UNAUTHENTICATED', 'Authentication required')
    );
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return next(
        new AppError(401, 'UNAUTHENTICATED', 'Authentication required')
      );
    }

    next(err);
  }
}

module.exports = {
  requireAuth,
};
