-- 010_project_skills.sql
-- Table 9 of 22: project_skills (junction: projects <-> skills)

CREATE TABLE IF NOT EXISTS project_skills (
  project_id  UUID NOT NULL,
  skill_id    UUID NOT NULL,

  PRIMARY KEY (project_id, skill_id),

  CONSTRAINT project_skills_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects (project_id)
    ON DELETE CASCADE,
  CONSTRAINT project_skills_skill_id_fkey
    FOREIGN KEY (skill_id) REFERENCES skills (skill_id)
    ON DELETE RESTRICT
);

-- Composite PK already indexes project_id as its leading column.
CREATE INDEX IF NOT EXISTS idx_project_skills_skill_id
  ON project_skills (skill_id);

COMMENT ON TABLE project_skills IS
  'Many-to-many: which skills a given project demonstrates.';
