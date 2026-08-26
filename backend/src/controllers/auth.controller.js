// Authentication HTTP layer.

const authService = require('../services/auth.service');

async function register(req, res) {
  const user = await authService.register(req.body);

  res.status(201).json({ user });
}

module.exports = {
  register,
};
