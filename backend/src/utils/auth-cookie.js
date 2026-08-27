const cookie = require('cookie');

const DEFAULT_COOKIE_NAME = 'clario_access';

function getCookieName() {
  return process.env.AUTH_COOKIE_NAME || DEFAULT_COOKIE_NAME;
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api',
    maxAge: 60 * 15,
  };
}

function setAuthCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(getCookieName(), token, getCookieOptions())
  );
}

function clearAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(getCookieName(), '', {
      ...getCookieOptions(),
      maxAge: 0,
    })
  );
}

function getAuthToken(req) {
  const header = req.headers.cookie;
  if (!header) return null;

  const cookies = cookie.parse(header);
  return cookies[getCookieName()] || null;
}

module.exports = {
  getAuthToken,
  setAuthCookie,
  clearAuthCookie,
};
