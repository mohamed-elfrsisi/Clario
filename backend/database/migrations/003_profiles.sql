-- 003_profiles.sql
-- Table 2 of 22: profiles
--
-- One profile per user. profile_id (not user_id) is the anchor that
-- almost every other table in the schema hangs off of, so this table
-- has to exist before anything else that references "profile_id".

CREATE TABLE IF NOT EXISTS profiles (
  profile_id      UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id         UUID NOT NULL,
  full_name       VARCHAR(255),
  field_of_study  VARCHAR(255),
  region          VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE,
  -- One profile per user. Deleting a user is an explicit,
  -- account-deletion-level operation; cascading to their single
  -- profile (and, transitively, everything the profile owns) is the
  -- expected behavior rather than leaving orphaned rows.
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- No separate index on user_id: the UNIQUE constraint above already
-- creates one. Adding another would be redundant.

COMMENT ON TABLE profiles IS
  'One-to-one extension of users holding profile-facing data. Deleting '
  'the owning user cascades here (ON DELETE CASCADE); deleting a '
  'profile cascades to essentially every other user-owned table below.';
