-- 016_opportunity_skills.sql
-- Table 15 of 22: opportunity_skills (junction: opportunities <-> skills)

CREATE TABLE IF NOT EXISTS opportunity_skills (
  opportunity_id    UUID NOT NULL,
  skill_id          UUID NOT NULL,
  importance_level  SMALLINT NOT NULL DEFAULT 3,

  PRIMARY KEY (opportunity_id, skill_id),

  CONSTRAINT opportunity_skills_opportunity_id_fkey
    FOREIGN KEY (opportunity_id) REFERENCES opportunities (opportunity_id)
    ON DELETE CASCADE,
  CONSTRAINT opportunity_skills_skill_id_fkey
    FOREIGN KEY (skill_id) REFERENCES skills (skill_id)
    ON DELETE RESTRICT,
  CONSTRAINT opportunity_skills_importance_level_range
    CHECK (importance_level BETWEEN 1 AND 5)
);

-- Composite PK already indexes opportunity_id as its leading column.
CREATE INDEX IF NOT EXISTS idx_opportunity_skills_skill_id
  ON opportunity_skills (skill_id);

COMMENT ON TABLE opportunity_skills IS
  'Many-to-many: which skills an opportunity requires, and how much '
  '(importance_level, 1-5).';
