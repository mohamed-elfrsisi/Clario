-- 018_skill_gaps.sql
-- Table 17 of 22: skill_gaps
--
-- DECISION - gap_level (see database/README.md "Ambiguities" for the
-- full writeup, per Phase 9 Step 19):
-- No pre-existing live database or migration history was found to
-- inspect, so there was nothing to confirm whether gap_level was
-- previously implemented as a generated/computed column. In the
-- absence of that evidence, and because "required_level minus
-- current_level" is the only definition implied by the column names
-- themselves, gap_level is implemented here as a STORED GENERATED
-- column so it can never drift out of sync with current_level/
-- required_level. If a different formula was intended, this is the
-- one place to change it.

CREATE TABLE IF NOT EXISTS skill_gaps (
  skill_gap_id     UUID PRIMARY KEY DEFAULT uuidv7(),
  analysis_id       UUID NOT NULL,
  skill_id          UUID NOT NULL,
  current_level     SMALLINT NOT NULL DEFAULT 0,
  required_level    SMALLINT NOT NULL DEFAULT 0,
  gap_level         SMALLINT
    GENERATED ALWAYS AS (required_level - current_level) STORED,
  priority_level    SMALLINT NOT NULL DEFAULT 3,
  notes             TEXT,

  CONSTRAINT skill_gaps_analysis_id_fkey
    FOREIGN KEY (analysis_id) REFERENCES analyses (analysis_id)
    ON DELETE CASCADE,
  CONSTRAINT skill_gaps_skill_id_fkey
    FOREIGN KEY (skill_id) REFERENCES skills (skill_id)
    ON DELETE RESTRICT,
  CONSTRAINT skill_gaps_current_level_range
    CHECK (current_level BETWEEN 0 AND 5),
  CONSTRAINT skill_gaps_required_level_range
    CHECK (required_level BETWEEN 0 AND 5),
  CONSTRAINT skill_gaps_priority_level_range
    CHECK (priority_level BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_skill_gaps_analysis_id
  ON skill_gaps (analysis_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_skill_id
  ON skill_gaps (skill_id);

COMMENT ON TABLE skill_gaps IS
  'Per-skill breakdown of a single analysis: how far current_level is '
  'from required_level for a given skill. gap_level is a STORED '
  'GENERATED column (required_level - current_level) - see migration '
  'comment above for why.';
