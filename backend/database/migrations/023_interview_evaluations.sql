-- 023_interview_evaluations.sql
-- Table 22 of 22: interview_evaluations

CREATE TABLE IF NOT EXISTS interview_evaluations (
  evaluation_id    UUID PRIMARY KEY DEFAULT uuidv7(),
  answer_id          UUID NOT NULL,
  score                NUMERIC(5, 2) NOT NULL,
  feedback              TEXT,
  evaluated_at           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT interview_evaluations_answer_id_fkey
    FOREIGN KEY (answer_id) REFERENCES interview_answers (answer_id)
    ON DELETE CASCADE,
  CONSTRAINT interview_evaluations_score_range
    CHECK (score BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_interview_evaluations_answer_id
  ON interview_evaluations (answer_id);

COMMENT ON TABLE interview_evaluations IS
  'Scored evaluation of a single interview answer. Cascades on answer '
  'delete.';
