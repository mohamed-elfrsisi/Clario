-- development.sql
--
-- Safe, fake, deterministic development seed data. Every UUID below is
-- a fixed literal (not the uuidv7() default) specifically so this file
-- is reproducible and re-runnable in a fresh dev database - the
-- `ON CONFLICT DO NOTHING` guards make it safe to run more than once.
--
-- DO NOT run this against a production database.
--
-- The password hash below is real (produced by the backend's actual
-- scrypt implementation, src/utils/password.js) but for a clearly
-- fake, seed-only password using a fixed non-random salt - it is not,
-- and must never be treated as, a real credential. The corresponding
-- plaintext is:
--
--   DevSeedOnly_NotARealPassword_123!
--
-- Use it to log in against a local dev database only.

BEGIN;

-- 1 user -----------------------------------------------------------
INSERT INTO users (user_id, email, password_hash, role, email_verified)
VALUES (
  '00000000-0000-7000-8000-000000000001',
  'dev.seed.user@clario.test',
  'scrypt$16384$8$1$07070707070707070707070707070707$295c85883af2ec98a18358aeebe78bd8ac0fcdcf20090ca3ebe75f7912d622905b37f880ca887bd9aa896f3f51854f0626d5cd99f6ef5f2b633cbf063cd751bc',
  'user',
  TRUE
)
ON CONFLICT (user_id) DO NOTHING;

-- 1 profile ----------------------------------------------------------
INSERT INTO profiles (profile_id, user_id, full_name, field_of_study, region)
VALUES (
  '00000000-0000-7000-8000-000000000002',
  '00000000-0000-7000-8000-000000000001',
  'Dev Seed User',
  'Computer Science',
  'Remote'
)
ON CONFLICT (profile_id) DO NOTHING;

-- Skills (shared reference data) --------------------------------------
INSERT INTO skills (skill_id, skill_name) VALUES
  ('00000000-0000-7000-8000-000000000010', 'JavaScript'),
  ('00000000-0000-7000-8000-000000000011', 'PostgreSQL'),
  ('00000000-0000-7000-8000-000000000012', 'System Design'),
  ('00000000-0000-7000-8000-000000000013', 'Communication')
ON CONFLICT (skill_id) DO NOTHING;

-- profile_skills --------------------------------------------------------
INSERT INTO profile_skills (profile_id, skill_id) VALUES
  ('00000000-0000-7000-8000-000000000002', '00000000-0000-7000-8000-000000000010'),
  ('00000000-0000-7000-8000-000000000002', '00000000-0000-7000-8000-000000000011')
ON CONFLICT DO NOTHING;

-- 1 experience + experience_skills ---------------------------------------
INSERT INTO experiences
  (experience_id, profile_id, title, company, start_date, end_date, description)
VALUES (
  '00000000-0000-7000-8000-000000000020',
  '00000000-0000-7000-8000-000000000002',
  'Backend Engineer',
  'Example Co',
  '2022-01-01',
  NULL,
  'Seed data for local development only.'
)
ON CONFLICT (experience_id) DO NOTHING;

INSERT INTO experience_skills (experience_id, skill_id) VALUES
  ('00000000-0000-7000-8000-000000000020', '00000000-0000-7000-8000-000000000010'),
  ('00000000-0000-7000-8000-000000000020', '00000000-0000-7000-8000-000000000011')
ON CONFLICT DO NOTHING;

-- 1 education -----------------------------------------------------------
INSERT INTO educations
  (education_id, profile_id, degree, institution, start_date, end_date)
VALUES (
  '00000000-0000-7000-8000-000000000030',
  '00000000-0000-7000-8000-000000000002',
  'B.Sc. Computer Science',
  'Example University',
  '2018-09-01',
  '2022-06-01'
)
ON CONFLICT (education_id) DO NOTHING;

-- 1 project + project_skills ---------------------------------------------
INSERT INTO projects
  (project_id, profile_id, title, description, start_date, end_date, url)
VALUES (
  '00000000-0000-7000-8000-000000000040',
  '00000000-0000-7000-8000-000000000002',
  'Clario Seed Project',
  'A placeholder project used only for local development seeding.',
  '2023-01-01',
  '2023-03-01',
  'https://example.com/seed-project'
)
ON CONFLICT (project_id) DO NOTHING;

INSERT INTO project_skills (project_id, skill_id) VALUES
  ('00000000-0000-7000-8000-000000000040', '00000000-0000-7000-8000-000000000010')
ON CONFLICT DO NOTHING;

-- 1 certification -----------------------------------------------------
INSERT INTO certifications
  (certification_id, profile_id, name, issuing_organization, issue_date, credential_id)
VALUES (
  '00000000-0000-7000-8000-000000000050',
  '00000000-0000-7000-8000-000000000002',
  'Example PostgreSQL Certification',
  'Example Certifying Body',
  '2023-06-01',
  'SEED-CRED-0001'
)
ON CONFLICT (certification_id) DO NOTHING;

-- 1 career_target + target_skills -----------------------------------
INSERT INTO career_targets
  (career_target_id, profile_id, target_role, target_industry, target_level, target_region, timeframe)
VALUES (
  '00000000-0000-7000-8000-000000000060',
  '00000000-0000-7000-8000-000000000002',
  'Senior Backend Engineer',
  'Software',
  'Senior',
  'Remote',
  '6-12 months'
)
ON CONFLICT (career_target_id) DO NOTHING;

INSERT INTO target_skills (career_target_id, skill_id, importance_level) VALUES
  ('00000000-0000-7000-8000-000000000060', '00000000-0000-7000-8000-000000000011', 5),
  ('00000000-0000-7000-8000-000000000060', '00000000-0000-7000-8000-000000000012', 4)
ON CONFLICT DO NOTHING;

-- 1 document ----------------------------------------------------------
INSERT INTO documents
  (document_id, profile_id, file_name, object_key, mime_type, file_size_bytes,
   document_type, scan_status, parseability_score, version_number)
VALUES (
  '00000000-0000-7000-8000-000000000070',
  '00000000-0000-7000-8000-000000000002',
  'seed-resume.pdf',
  'dev-seed/seed-resume.pdf',
  'application/pdf',
  102400,
  'resume',
  'clean',
  92.50,
  1
)
ON CONFLICT (document_id) DO NOTHING;

-- 1 opportunity + opportunity_skills ------------------------------------
INSERT INTO opportunities
  (opportunity_id, title, organization, description, job_url, region, role_type)
VALUES (
  '00000000-0000-7000-8000-000000000080',
  'Senior Backend Engineer',
  'Example Employer Inc.',
  'Seed data for local development only.',
  'https://example.com/careers/seed-role',
  'Remote',
  'Full-time'
)
ON CONFLICT (opportunity_id) DO NOTHING;

INSERT INTO opportunity_skills (opportunity_id, skill_id, importance_level) VALUES
  ('00000000-0000-7000-8000-000000000080', '00000000-0000-7000-8000-000000000010', 5),
  ('00000000-0000-7000-8000-000000000080', '00000000-0000-7000-8000-000000000011', 5)
ON CONFLICT DO NOTHING;

-- 1 analysis ------------------------------------------------------------
INSERT INTO analyses
  (analysis_id, profile_id, document_id, opportunity_id, match_percentage,
   parseability_score, summary)
VALUES (
  '00000000-0000-7000-8000-000000000090',
  '00000000-0000-7000-8000-000000000002',
  '00000000-0000-7000-8000-000000000070',
  '00000000-0000-7000-8000-000000000080',
  78.00,
  92.50,
  'Seed analysis for local development only.'
)
ON CONFLICT (analysis_id) DO NOTHING;

-- skill_gaps (gap_level is generated - not inserted explicitly) --------
INSERT INTO skill_gaps
  (skill_gap_id, analysis_id, skill_id, current_level, required_level, priority_level, notes)
VALUES (
  '00000000-0000-7000-8000-0000000000a0',
  '00000000-0000-7000-8000-000000000090',
  '00000000-0000-7000-8000-000000000012',
  2,
  4,
  4,
  'Seed skill gap for local development only.'
)
ON CONFLICT (skill_gap_id) DO NOTHING;

-- 1 career_alignment ------------------------------------------------
INSERT INTO career_alignments
  (career_alignment_id, analysis_id, career_target_id, alignment_score,
   matching_factors, missing_factors)
VALUES (
  '00000000-0000-7000-8000-0000000000b0',
  '00000000-0000-7000-8000-000000000090',
  '00000000-0000-7000-8000-000000000060',
  81.00,
  'PostgreSQL, JavaScript',
  'System Design depth'
)
ON CONFLICT (career_alignment_id) DO NOTHING;

-- 1 interview + questions + answers + evaluations ------------------------
INSERT INTO interviews
  (interview_id, profile_id, opportunity_id, interview_type, status,
   scheduled_at, started_at, ended_at, overall_score, feedback)
VALUES (
  '00000000-0000-7000-8000-0000000000c0',
  '00000000-0000-7000-8000-000000000002',
  '00000000-0000-7000-8000-000000000080',
  'mock_technical',
  'completed',
  clock_timestamp(),
  clock_timestamp(),
  clock_timestamp(),
  74.00,
  'Seed interview for local development only.'
)
ON CONFLICT (interview_id) DO NOTHING;

INSERT INTO interview_questions
  (question_id, interview_id, question_text, question_type, order_index)
VALUES (
  '00000000-0000-7000-8000-0000000000d0',
  '00000000-0000-7000-8000-0000000000c0',
  'Describe how you would design a database schema for a job-matching platform.',
  'technical',
  1
)
ON CONFLICT (question_id) DO NOTHING;

INSERT INTO interview_answers
  (answer_id, question_id, answer_text, answer_type, answered_at)
VALUES (
  '00000000-0000-7000-8000-0000000000e0',
  '00000000-0000-7000-8000-0000000000d0',
  'Seed answer text for local development only.',
  'text',
  clock_timestamp()
)
ON CONFLICT (answer_id) DO NOTHING;

INSERT INTO interview_evaluations
  (evaluation_id, answer_id, score, feedback)
VALUES (
  '00000000-0000-7000-8000-0000000000f0',
  '00000000-0000-7000-8000-0000000000e0',
  74.00,
  'Seed evaluation for local development only.'
)
ON CONFLICT (evaluation_id) DO NOTHING;

COMMIT;
