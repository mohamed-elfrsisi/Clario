// Authentication business/application layer.
// This phase implements registration only. Login belongs to Phase 6.

const authRepository = require('../repositories/auth.repository');
const AppError = require('../errors/app-error');
const { hashPassword } = require('../utils/password');

async function register({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await authRepository.findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Email is already registered');
  }

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await authRepository.createUser(normalizedEmail, passwordHash);
  } catch (err) {
    // The pre-check improves the common path, but the database UNIQUE
    // constraint is the final authority and protects against races.
    if (err.code === '23505') {
      throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Email is already registered');
    }

    throw err;
  }

  return {
    userId: user.user_id,
    email: user.email,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

module.exports = {
  register,
};
