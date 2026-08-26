// Password hashing utility.
//
// We use Node's built-in scrypt password-based key derivation function so
// Phase 5 does not require a native dependency. scrypt is deliberately
// memory-hard and is designed for password storage.

const crypto = require('crypto');

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
};

function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      KEY_LENGTH,
      SCRYPT_OPTIONS,
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey);
      }
    );
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = await deriveKey(password, salt);

  // Keep the algorithm parameters with the hash so the format can be
  // migrated safely if the parameters are increased in the future.
  return [
    'scrypt',
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt.toString('hex'),
    derivedKey.toString('hex'),
  ].join('$');
}

async function verifyPassword(password, storedHash) {
  const parts = storedHash.split('$');

  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, n, r, p, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const expectedHash = Buffer.from(hashHex, 'hex');

  if (!salt.length || !expectedHash.length) {
    return false;
  }

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      expectedHash.length,
      {
        N: Number(n),
        r: Number(r),
        p: Number(p),
        maxmem: 32 * 1024 * 1024,
      },
      (err, key) => {
        if (err) return reject(err);
        resolve(key);
      }
    );
  });

  return (
    derivedKey.length === expectedHash.length &&
    crypto.timingSafeEqual(derivedKey, expectedHash)
  );
}

module.exports = {
  hashPassword,
  verifyPassword,
};
