-- 008_educations.sql
-- Table 7 of 22: educations

CREATE TABLE IF NOT EXISTS educations (
  education_id  UUID PRIMARY KEY DEFAULT uuidv7(),
  profile_id    UUID NOT NULL,
  degree        VARCHAR(255),
  institution   VARCHAR(255),
  start_date    DATE,
  end_date      DATE,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT educations_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
    ON DELETE CASCADE,
  CONSTRAINT educations_date_order_check
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_educations_profile_id
  ON educations (profile_id);

COMMENT ON TABLE educations IS
  'Education history entries owned by a profile. Cascades on profile '
  'delete.';
