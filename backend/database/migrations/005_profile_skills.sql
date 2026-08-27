-- 005_profile_skills.sql
-- Table 4 of 22: profile_skills (junction: profiles <-> skills)

CREATE TABLE IF NOT EXISTS profile_skills (
  profile_id  UUID NOT NULL,
  skill_id    UUID NOT NULL,

  PRIMARY KEY (profile_id, skill_id),

  CONSTRAINT profile_skills_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles (profile_id)
    ON DELETE CASCADE,
  -- Deleting the referenced skill from the shared reference table
  -- should not be allowed to silently disappear from a profile without
  -- a decision being made about what happens to that skill's data
  -- elsewhere (experiences, projects, analyses, ...). RESTRICT keeps
  -- that deletion an explicit, deliberate operation.
  CONSTRAINT profile_skills_skill_id_fkey
    FOREIGN KEY (skill_id) REFERENCES skills (skill_id)
    ON DELETE RESTRICT
);

-- The composite primary key (profile_id, skill_id) already indexes
-- profile_id as its leading column. skill_id needs its own index for
-- efficient reverse lookups ("which profiles have skill X").
CREATE INDEX IF NOT EXISTS idx_profile_skills_skill_id
  ON profile_skills (skill_id);

COMMENT ON TABLE profile_skills IS
  'Many-to-many: which skills a profile claims. Deleting a profile '
  'cascades here; deleting a skill is restricted while it is still in '
  'use by any profile.';
