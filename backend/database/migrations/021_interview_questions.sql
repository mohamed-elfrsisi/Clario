-- 021_interview_questions.sql
-- Table 20 of 22: interview_questions

CREATE TABLE IF NOT EXISTS interview_questions (
  question_id     UUID PRIMARY KEY DEFAULT uuidv7(),
  interview_id      UUID NOT NULL,
  question_text      TEXT NOT NULL,
  question_type       VARCHAR(255) NOT NULL,
  order_index          INTEGER NOT NULL,

  CONSTRAINT interview_questions_interview_id_fkey
    FOREIGN KEY (interview_id) REFERENCES interviews (interview_id)
    ON DELETE CASCADE,
  CONSTRAINT interview_questions_order_index_check
    CHECK (order_index >= 0)
);

-- NOTE: deliberately not adding UNIQUE(interview_id, order_index) -
-- the approved design doesn't specify that order_index values must be
-- unique per interview, and inventing that rule could reject legitimate
-- application data (e.g. re-ordering in progress, ties). Add it later
-- if the application actually requires strict ordering.

CREATE INDEX IF NOT EXISTS idx_interview_questions_interview_id
  ON interview_questions (interview_id);

COMMENT ON TABLE interview_questions IS
  'Questions belonging to a single interview session, in order_index '
  'order. Cascades on interview delete.';
