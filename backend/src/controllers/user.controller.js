// src/controllers/user.controller.js
//
// Controllers are the HTTP layer. They read HTTP input, call services,
// choose HTTP status codes, and send JSON responses.
// They do not contain SQL or PostgreSQL pool access.

const userService = require("../services/user.service");
const AppError = require("../errors/app-error");

async function getUserCount(req, res) {
  const count = await userService.getUserCount();

  res.status(200).json({ count });
}

async function getUserByEmail(req, res) {
  const { email } = req.query;
  const user = await userService.getUserByEmail(email);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  res.status(200).json({ user });
}

module.exports = {
  getUserCount,
  getUserByEmail,
};
