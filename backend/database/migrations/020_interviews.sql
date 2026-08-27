-- 020_interviews.sql
-- Table 19 of 22: interviews

CREATE TABLE IF NOT EXISTS interviews (
  interview_id     UUID PRIMARY KEY DEFAULT uuidv7(),
  profile_id        UUID NOT NULL,
  opportunity_id     UUID,
  interview_type     VARCHAR(255) NOT NULL,
  status              VARCHAR(32) NOT NULL DEFAULT 'created',
  scheduled_at        TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  ended_at            TIMESTAMPTZ,
  overall_score        NUMERIC(5, 2),
  feedback             TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT interviews_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
    ON DELETE CASCADE,
  -- opportunity_id is nullable (a practice interview need not target a
  -- real posting). RESTRICT rather than CASCADE/SET NULL: an
  -- opportunity being deleted shouldn't silently detach interviews
  -- that were run against it.
  CONSTRAINT interviews_opportunity_id_fkey
    FOREIGN KEY (opportunity_id) REFERENCES opportunities (opportunity_id)
    ON DELETE RESTRICT,
  CONSTRAINT interviews_overall_score_range
    CHECK (overall_score IS NULL OR overall_score BETWEEN 0 AND 100),
  CONSTRAINT interviews_timing_order_check
    CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_interviews_profile_id
  ON interviews (profile_id);
CREATE INDEX IF NOT EXISTS idx_interviews_opportunity_id
  ON interviews (opportunity_id);

COMMENT ON TABLE interviews IS
  'A mock/practice interview session owned by a profile, optionally '
  'tied to a specific opportunity.';
