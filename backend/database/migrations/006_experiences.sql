-- 006_experiences.sql
-- Table 5 of 22: experiences

CREATE TABLE IF NOT EXISTS experiences (
  experience_id  UUID PRIMARY KEY DEFAULT uuidv7(),
  profile_id     UUID NOT NULL,
  title          VARCHAR(255) NOT NULL,
  company        VARCHAR(255),
  start_date     DATE NOT NULL,
  end_date       DATE,
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT experiences_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
    ON DELETE CASCADE,
  CONSTRAINT experiences_date_order_check
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_experiences_profile_id
  ON experiences (profile_id);

COMMENT ON TABLE experiences IS
  'Work history entries owned by a profile. Cascades on profile delete.';
