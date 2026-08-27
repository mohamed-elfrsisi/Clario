-- 007_experience_skills.sql
-- Table 6 of 22: experience_skills (junction: experiences <-> skills)

CREATE TABLE IF NOT EXISTS experience_skills (
  experience_id  UUID NOT NULL,
  skill_id       UUID NOT NULL,

  PRIMARY KEY (experience_id, skill_id),

  CONSTRAINT experience_skills_experience_id_fkey
    FOREIGN KEY (experience_id) REFERENCES experiences (experience_id)
    ON DELETE CASCADE,
  CONSTRAINT experience_skills_skill_id_fkey
    FOREIGN KEY (skill_id) REFERENCES skills (skill_id)
    ON DELETE RESTRICT
);

-- Composite PK already indexes experience_id as its leading column.
CREATE INDEX IF NOT EXISTS idx_experience_skills_skill_id
  ON experience_skills (skill_id);

COMMENT ON TABLE experience_skills IS
  'Many-to-many: which skills were used/demonstrated in a given '
  'experience entry.';
