// Authentication business/application layer.
// Phase 5: registration.
// Phase 6: login, authenticated identity, and logout support.

const authRepository = require('../repositories/auth.repository');
const AppError = require('../errors/app-error');
const { hashPassword, verifyPassword } = require('../utils/password');
const { createAccessToken } = require('../utils/token');

// Fixed, non-secret scrypt hash used ONLY to burn an equivalent amount
// of CPU time when a login is attempted against an email that doesn't
// exist (see the timing note in login() below). This is not a real
// password hash for any real account - it never matches any user's
// actual password_hash - it exists purely to make the "user not
// found" and "wrong password" code paths take the same amount of time.
const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$805d6d3fdd1b8bf87c5b8e017266d6b3$d48e3ddfb9d3265543b9e2285aa335896a8de8572917d2df91b5fd254e13ff409ea27cbce0ca28acc474472addb3bd3010e164fc6aadcbed89221c058832d653';

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
  //
  // SECURITY (Phase 8): the response *body* was already identical for
  // both cases, but the response *time* was not - when `user` is null
  // we used to return immediately, skipping the scrypt call entirely,
  // while a wrong-password attempt always paid the full scrypt cost.
  // That timing gap is itself an oracle an attacker can use to
  // enumerate registered emails. We close it by doing an equivalent
  // amount of hashing work (against a fixed dummy hash) even when the
  // user doesn't exist, so both paths take comparable time.
  const passwordValid = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, DUMMY_PASSWORD_HASH);

  if (!user || !passwordValid) {
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
