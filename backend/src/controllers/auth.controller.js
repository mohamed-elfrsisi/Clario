// Authentication HTTP layer.

const authService = require('../services/auth.service');
const {
  setAuthCookie,
  clearAuthCookie,
} = require('../utils/auth-cookie');

async function register(req, res) {
  const user = await authService.register(req.body);

  res.status(201).json({ user });
}

async function login(req, res) {
  const result = await authService.login(req.body);

  setAuthCookie(res, result.token);

  // The token itself is intentionally NOT returned in JSON.
  // Browser clients authenticate through the HttpOnly cookie.
  res.status(200).json({
    user: result.user,
  });
}

async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.userId);

  res.status(200).json({ user });
}

function logout(req, res) {
  clearAuthCookie(res);

  res.status(204).send();
}

module.exports = {
  register,
  login,
  me,
  logout,
};
