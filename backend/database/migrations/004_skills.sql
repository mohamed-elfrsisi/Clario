-- 004_skills.sql
-- Table 3 of 22: skills
--
-- Shared reference/lookup data - one row per distinct skill, reused
-- across profiles, experiences, projects, career targets and
-- opportunities via junction tables. Deliberately has no owner column;
-- it is not user-owned data.

CREATE TABLE IF NOT EXISTS skills (
  skill_id    UUID PRIMARY KEY DEFAULT uuidv7(),
  skill_name  VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT skills_skill_name_key UNIQUE (skill_name)
);

-- UNIQUE constraint above already provides an index for name lookups.

COMMENT ON TABLE skills IS
  'Shared reference data - the canonical list of skills referenced by '
  'profile_skills, experience_skills, project_skills, target_skills and '
  'opportunity_skills. Not user-owned; do not cascade-delete this table '
  'from any owning row.';
