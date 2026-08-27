-- 022_interview_answers.sql
-- Table 21 of 22: interview_answers

CREATE TABLE IF NOT EXISTS interview_answers (
  answer_id      UUID PRIMARY KEY DEFAULT uuidv7(),
  question_id      UUID NOT NULL,
  answer_text        TEXT,
  answer_type          VARCHAR(255),
  answered_at           TIMESTAMPTZ,

  CONSTRAINT interview_answers_question_id_fkey
    FOREIGN KEY (question_id) REFERENCES interview_questions (question_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_interview_answers_question_id
  ON interview_answers (question_id);

COMMENT ON TABLE interview_answers IS
  'A recorded answer to an interview question. Cascades on question '
  'delete (which cascades from interview delete).';
