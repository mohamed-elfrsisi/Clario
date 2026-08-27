-- 009_projects.sql
-- Table 8 of 22: projects

CREATE TABLE IF NOT EXISTS projects (
  project_id   UUID PRIMARY KEY DEFAULT uuidv7(),
  profile_id   UUID NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  start_date   DATE,
  end_date     DATE,
  url          VARCHAR(2048),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT projects_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
    ON DELETE CASCADE,
  CONSTRAINT projects_date_order_check
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_projects_profile_id
  ON projects (profile_id);

COMMENT ON TABLE projects IS
  'Portfolio project entries owned by a profile. Cascades on profile '
  'delete.';
