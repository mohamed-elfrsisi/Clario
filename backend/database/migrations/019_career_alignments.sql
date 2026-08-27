-- 019_career_alignments.sql
-- Table 18 of 22: career_alignments

CREATE TABLE IF NOT EXISTS career_alignments (
  career_alignment_id  UUID PRIMARY KEY DEFAULT uuidv7(),
  analysis_id            UUID NOT NULL,
  career_target_id        UUID NOT NULL,
  alignment_score         NUMERIC(5, 2) NOT NULL,
  matching_factors        TEXT,
  missing_factors         TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT career_alignments_analysis_id_fkey
    FOREIGN KEY (analysis_id) REFERENCES analyses (analysis_id)
    ON DELETE CASCADE,
  CONSTRAINT career_alignments_career_target_id_fkey
    FOREIGN KEY (career_target_id)
    REFERENCES career_targets (career_target_id)
    ON DELETE CASCADE,
  CONSTRAINT career_alignments_alignment_score_range
    CHECK (alignment_score BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_career_alignments_analysis_id
  ON career_alignments (analysis_id);
CREATE INDEX IF NOT EXISTS idx_career_alignments_career_target_id
  ON career_alignments (career_target_id);

COMMENT ON TABLE career_alignments IS
  'How well a given analysis aligns with a specific career target.';
