// Authentication business/application layer.
// Phase 5: registration.
// Phase 6: login, authenticated identity, and logout support.

const authRepository = require('../repositories/auth.repository');
const AppError = require('../errors/app-error');
const { hashPassword, verifyPassword } = require('../utils/password');
const { createAccessToken } = require('../utils/token');

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

async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await authRepository.findUserByEmail(normalizedEmail);

  // Deliberately use the same public error for unknown email and wrong
  // password. This avoids revealing which email addresses are registered.
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const passwordValid = await verifyPassword(password, user.password_hash);

  if (!passwordValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = createAccessToken(user);

  return {
    token,
    user: {
      userId: user.user_id,
      email: user.email,
      role: user.role,
    },
  };
}

async function getCurrentUser(userId) {
  const user = await authRepository.findPublicUserById(userId);

  if (!user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is no longer valid');
  }

  return {
    userId: user.user_id,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

module.exports = {
  register,
  login,
  getCurrentUser,
};
