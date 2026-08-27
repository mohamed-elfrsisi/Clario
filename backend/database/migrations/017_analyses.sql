-- 017_analyses.sql
-- Table 16 of 22: analyses
--
-- The join point of the "match a profile's document against an
-- opportunity" workflow. skill_gaps and career_alignments hang off of
-- a specific analysis.

CREATE TABLE IF NOT EXISTS analyses (
  analysis_id          UUID PRIMARY KEY DEFAULT uuidv7(),
  profile_id            UUID NOT NULL,
  document_id            UUID NOT NULL,
  opportunity_id          UUID NOT NULL,
  analysis_date           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  match_percentage        NUMERIC(5, 2),
  parseability_score      NUMERIC(5, 2),
  summary                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT analyses_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
    ON DELETE CASCADE,
  -- A document being deleted while an analysis still references it
  -- would leave the analysis pointing at nothing meaningful; RESTRICT
  -- forces that to be resolved explicitly (e.g. delete the analysis
  -- first, or don't allow deleting analyzed documents).
  CONSTRAINT analyses_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES documents (document_id)
    ON DELETE RESTRICT,
  CONSTRAINT analyses_opportunity_id_fkey
    FOREIGN KEY (opportunity_id) REFERENCES opportunities (opportunity_id)
    ON DELETE RESTRICT,
  CONSTRAINT analyses_match_percentage_range
    CHECK (match_percentage IS NULL OR match_percentage BETWEEN 0 AND 100),
  CONSTRAINT analyses_parseability_score_range
    CHECK (
      parseability_score IS NULL
      OR parseability_score BETWEEN 0 AND 100
    )
);

CREATE INDEX IF NOT EXISTS idx_analyses_profile_id ON analyses (profile_id);
CREATE INDEX IF NOT EXISTS idx_analyses_document_id ON analyses (document_id);
CREATE INDEX IF NOT EXISTS idx_analyses_opportunity_id
  ON analyses (opportunity_id);

COMMENT ON TABLE analyses IS
  'One run of "match this profile''s document against this opportunity". '
  'skill_gaps and career_alignments are the detailed breakdown of a '
  'given analysis.';
