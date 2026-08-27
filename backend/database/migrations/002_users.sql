-- 002_users.sql
--
-- Table 1 of 22: users
--
-- This table already exists conceptually in the running backend
-- (src/repositories/auth.repository.js and user.repository.js query it
-- directly), so its column names/types here are constrained by what
-- the existing application code already expects: user_id, email,
-- password_hash, role, created_at, updated_at. email_verified is part
-- of the approved design but is not yet read/written by any backend
-- code - it is included now so later phases don't need another
-- migration just to add it.

CREATE TABLE IF NOT EXISTS users (
  user_id         UUID PRIMARY KEY DEFAULT uuidv7(),
  email           email_address NOT NULL,
  password_hash   TEXT NOT NULL,
  role            VARCHAR(32) NOT NULL DEFAULT 'user',
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT users_email_key UNIQUE (email)
);

-- NOTE: the approved design does not enumerate valid `role` values, and
-- the backend currently only ever writes the column default ('user').
-- Deliberately NOT adding a CHECK(role IN (...)) here - that would be
-- inventing a business rule the design doesn't specify, and it would
-- block adding a new role from the application without a migration.

COMMENT ON TABLE users IS
  'Application accounts. One row per login identity. Owns exactly one '
  'profile (see profiles.user_id).';
COMMENT ON COLUMN users.role IS
  'Coarse authorization role, e.g. user/admin. No CHECK constraint - '
  'the approved design does not enumerate valid values.';
