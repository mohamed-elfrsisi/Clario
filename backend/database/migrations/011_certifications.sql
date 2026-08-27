-- 011_certifications.sql
-- Table 10 of 22: certifications

CREATE TABLE IF NOT EXISTS certifications (
  certification_id      UUID PRIMARY KEY DEFAULT uuidv7(),
  profile_id            UUID NOT NULL,
  name                   VARCHAR(255) NOT NULL,
  issuing_organization   VARCHAR(255),
  issue_date             DATE,
  expiration_date        DATE,
  credential_id          VARCHAR(255),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT certifications_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
    ON DELETE CASCADE,
  CONSTRAINT certifications_date_order_check
    CHECK (
      expiration_date IS NULL OR issue_date IS NULL
      OR expiration_date >= issue_date
    )
);

CREATE INDEX IF NOT EXISTS idx_certifications_profile_id
  ON certifications (profile_id);

COMMENT ON TABLE certifications IS
  'Professional certifications owned by a profile. Cascades on profile '
  'delete.';
