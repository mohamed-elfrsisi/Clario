// Authentication token utilities.
//
// Phase 6 uses a short-lived JWT stored in an HttpOnly cookie.
// JWT signing is delegated to the well-established jsonwebtoken package.
// The token contains only the minimum identity claims needed by the API.

const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }

  return secret;
}

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: 'clario-api',
      audience: 'clario-web',
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    issuer: 'clario-api',
    audience: 'clario-web',
  });
}

module.exports = {
  createAccessToken,
  verifyAccessToken,
};
