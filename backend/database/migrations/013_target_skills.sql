-- 013_target_skills.sql
-- Table 12 of 22: target_skills (junction: career_targets <-> skills)

CREATE TABLE IF NOT EXISTS target_skills (
  career_target_id  UUID NOT NULL,
  skill_id          UUID NOT NULL,
  importance_level  SMALLINT NOT NULL DEFAULT 3,

  PRIMARY KEY (career_target_id, skill_id),

  CONSTRAINT target_skills_career_target_id_fkey
    FOREIGN KEY (career_target_id)
    REFERENCES career_targets (career_target_id)
    ON DELETE CASCADE,
  CONSTRAINT target_skills_skill_id_fkey
    FOREIGN KEY (skill_id) REFERENCES skills (skill_id)
    ON DELETE RESTRICT,
  CONSTRAINT target_skills_importance_level_range
    CHECK (importance_level BETWEEN 1 AND 5)
);

-- Composite PK already indexes career_target_id as its leading column.
CREATE INDEX IF NOT EXISTS idx_target_skills_skill_id
  ON target_skills (skill_id);

COMMENT ON TABLE target_skills IS
  'Many-to-many: which skills matter for a career target, and how much '
  '(importance_level, 1-5).';
