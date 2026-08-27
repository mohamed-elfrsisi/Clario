-- 015_opportunities.sql
-- Table 14 of 22: opportunities
--
-- Not user-owned: opportunities (job postings) are shared reference
-- data that many profiles can be analyzed against.

CREATE TABLE IF NOT EXISTS opportunities (
  opportunity_id  UUID PRIMARY KEY DEFAULT uuidv7(),
  title            VARCHAR(255) NOT NULL,
  organization     VARCHAR(255),
  description      TEXT,
  job_url          TEXT,
  region           VARCHAR(255),
  role_type        VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE opportunities IS
  'Job/role postings. Not owned by any single profile - referenced by '
  'analyses and interviews for many different profiles.';
