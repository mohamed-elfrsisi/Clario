-- 012_career_targets.sql
-- Table 11 of 22: career_targets

CREATE TABLE IF NOT EXISTS career_targets (
  career_target_id  UUID PRIMARY KEY DEFAULT uuidv7(),
  profile_id        UUID NOT NULL,
  target_role       VARCHAR(255) NOT NULL,
  target_industry   VARCHAR(255),
  target_level      VARCHAR(255),
  target_region     VARCHAR(255),
  timeframe         VARCHAR(255),
  additional_notes  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT career_targets_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_career_targets_profile_id
  ON career_targets (profile_id);

COMMENT ON TABLE career_targets IS
  'A profile''s stated career goals. A profile may have more than one '
  'target over time; cascades on profile delete.';
