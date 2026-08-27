# Clario database

Phase 9 deliverable: the real, version-controlled PostgreSQL schema for
Clario. This directory is meant to be the single source of truth for
the database — if a table, constraint, or index doesn't come from a
file in here, it isn't part of the schema.

## Status: PARTIAL (see "What could not be done in this environment" below)

Every file in this directory was written and reviewed, but **could not
be executed against a real PostgreSQL server**, because no PostgreSQL
server, client, or install path was available in the sandbox this work
was done in (no `psql`/`postgres` binary, no Docker, and no network
access to install either — `apt-get update` returned `403 Forbidden`
for every mirror). See the "Verification" section for exactly what that
does and doesn't mean for you.

## Requirements

- **PostgreSQL 18+**. This schema uses the native `uuidv7()` builtin
  for every UUID primary key default. On an older server, `uuidv7()`
  does not exist and migration `001` will fail its own self-check
  before creating anything else (see that file). If you must run on
  an older PostgreSQL version, install the `pg_uuidv7` extension and
  adjust migration `001` accordingly, or replace `uuidv7()` with
  `gen_random_uuid()` throughout (loses time-ordering, still correct).
- The `citext` extension (bundled with PostgreSQL, enabled by migration
  `001`) for case-insensitive email storage/uniqueness.

## Database name and role

- Database: `clario_db`
- Application role: `clario_app` — `LOGIN`, `NOSUPERUSER`,
  `NOCREATEDB`, `NOCREATEROLE`. Granted `SELECT/INSERT/UPDATE/DELETE`
  on all tables and `USAGE`/`SELECT` on all sequences (see migration
  `024_roles_and_grants.sql`), nothing else. It cannot run DDL, create
  extensions, or manage roles.
- Migrations must be run as a more-privileged owner/admin role (able to
  `CREATE EXTENSION`, `CREATE ROLE`, `CREATE TABLE`) — never as
  `clario_app`, and never as the `postgres` superuser from the running
  Node application (`src/config/database.js` connects via
  `DATABASE_URL`, which should point at `clario_app` in every
  environment except when actually running migrations).
- `clario_app`'s password is **not** set by any file here. Set it
  once, out of band:
  ```sql
  ALTER ROLE clario_app WITH PASSWORD '<generated-secret>';
  ```
  and put the resulting connection string in a real, untracked `.env`.

## Migration process

No migration framework (Knex, node-pg-migrate, Sequelize migrations,
Prisma, etc.) was found anywhere in the existing project — `package.json`
has no such dependency, and there was no pre-existing `database/` or
`migrations/` directory to inspect. Rather than introduce a new
framework as a side effect of a database-schema phase, this directory
uses plain, numbered `.sql` files plus a ~50-line dependency-free
runner script that reuses the `pg` package already in the project's
`node_modules`. If the team later adopts a real migration framework,
these `.sql` files are the content to import into it.

```
database/
├── migrations/           # 001-024, run in filename order
├── seeds/development.sql # fake, deterministic dev-only data
├── scripts/
│   ├── migrate.js        # runs every migrations/*.sql file, in order
│   └── seed.js            # applies seeds/development.sql
└── README.md              # this file
```

Run migrations (against an owner/admin `DATABASE_URL`):
```
DATABASE_URL=postgresql://<owner>:<password>@localhost:5432/clario_db \
  node database/scripts/migrate.js
```

Apply development seed data (against any role with INSERT — `clario_app`
is fine):
```
DATABASE_URL=postgresql://clario_app:<password>@localhost:5432/clario_db \
  node database/scripts/seed.js
```

Every migration is written to be safe to re-run (`CREATE TABLE IF NOT
EXISTS`, `CREATE INDEX IF NOT EXISTS`, guarded `DO` blocks for
extensions/domains/roles), and the seed file uses `ON CONFLICT DO
NOTHING` throughout. There is currently no `schema_migrations` tracking
table — see the comment at the top of `scripts/migrate.js` for why, and
what would need to change if migrations stop being idempotent.

## Schema overview — 22 tables

| # | Table | Purpose |
|---|-------|---------|
| 1 | `users` | Login identities |
| 2 | `profiles` | One per user; anchor for most other tables |
| 3 | `skills` | Shared reference data |
| 4 | `profile_skills` | profiles ↔ skills |
| 5 | `experiences` | Work history |
| 6 | `experience_skills` | experiences ↔ skills |
| 7 | `educations` | Education history |
| 8 | `projects` | Portfolio projects |
| 9 | `project_skills` | projects ↔ skills |
| 10 | `certifications` | Professional certifications |
| 11 | `career_targets` | Stated career goals |
| 12 | `target_skills` | career_targets ↔ skills |
| 13 | `documents` | Uploaded files (metadata only — bytes live in object storage) |
| 14 | `opportunities` | Job postings (shared, not user-owned) |
| 15 | `opportunity_skills` | opportunities ↔ skills |
| 16 | `analyses` | One profile-document-vs-opportunity match run |
| 17 | `skill_gaps` | Per-skill breakdown of an analysis |
| 18 | `career_alignments` | How an analysis aligns with a career target |
| 19 | `interviews` | Mock interview sessions |
| 20 | `interview_questions` | Questions in an interview |
| 21 | `interview_answers` | Answers to questions |
| 22 | `interview_evaluations` | Scored evaluation of an answer |

Full column lists, constraints, and comments live in each table's own
migration file — that's the authoritative source, not this table.

## Relationships, ownership, and delete behavior

Everything ultimately hangs off `users` → `profiles`. Deleting a user
cascades to their profile, and deleting a profile cascades to
everything that profile owns directly (`experiences`, `educations`,
`projects`, `certifications`, `career_targets`, `documents`,
`analyses`, `interviews`) and transitively (their skills junctions,
skill_gaps, career_alignments, questions, answers, evaluations).

Shared/reference data is **not** cascade-deletable from user data:
- `skills` — referenced by five junction tables; deleting a skill that
  is still in use is `RESTRICT`ed.
- `opportunities` — deleting one while `analyses` or `interviews` still
  reference it is `RESTRICT`ed.
- `documents.parent_document_id` (self-reference for versioning) is
  `RESTRICT`ed for the same reason.

This is a deliberate split: **cascade within what a profile owns,
restrict everything that crosses into shared/reference data** — see
each migration file's comments for the specific reasoning per table.

## Constraints

- Every numeric "level"/"score"/"percentage" column has a `CHECK` range
  constraint matching the approved design (0–100 for
  percentages/scores, 1–5 for importance/priority, 0–5 for skill
  levels).
- `file_size_bytes >= 0`, `version_number >= 1`.
- Date-order checks (`end_date >= start_date`, etc.) wherever both
  dates exist.
- `users.email` is unique via a `citext`-backed `email_address` domain
  (case-insensitive) with a structural-format `CHECK`.
- **Deliberately not added:** a `CHECK` enumerating valid `users.role`
  values, and a uniqueness constraint on
  `(interview_id, order_index)` in `interview_questions`. Neither is
  specified by the approved design, and inventing either risked
  rejecting legitimate future application data — see the comments in
  `002_users.sql` and `021_interview_questions.sql`.

## Indexes

Every foreign-key column has an index *unless* it's already covered
for free — a single-column `PRIMARY KEY`/`UNIQUE` constraint already
creates one, and a composite `PRIMARY KEY` already indexes its leading
column. Where that applied, no redundant index was added (each
migration file says explicitly which case applies). The trailing
column of every many-to-many junction table's composite key
(`skill_id`, in every case here) gets its own index for efficient
reverse lookups.

## RLS

No Row-Level Security policies were created. The approved-design
instructions for this phase were explicit that RLS should not be
invented before the application's database connection can correctly
identify the authenticated application user (right now, the backend
connects as a single shared `clario_app` role — there's no
per-request database session identity for policies to key off of).
Documenting this as **future work**: once per-request session context
exists (e.g. via `SET LOCAL app.current_user_id` per request, or a
per-request role), RLS policies scoped to `profile_id`/`user_id`
ownership become straightforward to add as their own migration.

## Ambiguities and decisions made (Phase 9 Step 19)

- **`skill_gaps.gap_level`**: the approved design says to preserve
  generated/computed behavior *if the existing design already defines
  it that way*. No pre-existing live database or migration history
  existed to inspect (see "Status" above), so there was nothing to
  confirm either way. Implemented as a `STORED GENERATED` column
  (`required_level - current_level`) — the only definition implied by
  the column names — so it can't drift out of sync. Change the
  generation expression in `018_skill_gaps.sql` if a different formula
  was actually intended.
- **`users.role`**: no enumerated value set in the approved design;
  left unconstrained rather than inventing one (see "Constraints").
- **`documents.scan_status` / `interviews.status`**: no enumerated
  value sets given either; left as unconstrained `VARCHAR` rather than
  guessing a state machine that belongs to the application layer.
- **`skills.skill_name` uniqueness**: not explicitly required by the
  design, but added as a reasonable constraint for shared reference
  data (avoids duplicate skill rows like "JavaScript" vs "javascript"
  entered twice) — this is a judgment call, flagged here rather than
  silently made.

## What could not be done in this environment

The sandbox this phase was executed in has **no PostgreSQL server, no
`psql`/`postgres` binary, no Docker, and no network access** (`apt-get
update` fails with `403 Forbidden` on every configured mirror; direct
TCP to the public internet is also blocked). As a direct consequence,
the following acceptance-criteria items from the phase spec could
**not** be completed here, and need to happen wherever this repository
actually runs with real PostgreSQL access:

- Creating a real `clario_db` database and `clario_app` role
- Running `database/scripts/migrate.js` against a live server
- Running `database/scripts/seed.js` against a live server
- The `SELECT current_database(); SELECT current_user;` /
  table-count / constraint / index / JOIN verification queries from
  Phase 9 Step 14
- Confirming `npm test`'s integration suite passes against a live
  database (see "Testing" below — it currently fails for the expected
  reason: no reachable database)
- Confirming `npm audit` (also blocked — it needs registry access,
  which this sandbox does not have)

What **was** possible, and was done: full inspection of the existing
project (Step 1 — no git repo, no existing migrations, no existing
`database/` directory, `users` table columns constrained by the
already-written `auth.repository.js`/`user.repository.js` code), all
22 table migrations, roles/grants, seed data, this documentation, and
running the existing unit test suite as a baseline.

## Testing — baseline results (this environment)

```
$ npm test
Test Suites: 5 failed, 4 passed, 9 total
Tests:       17 failed, 37 passed, 54 total
```

- **Passed (37, 4 suites)** — all pure-logic unit tests that don't
  touch PostgreSQL: `password.test.js`, `token.test.js`,
  `app-error.test.js`, `validation.middleware.test.js`.
- **Failed (17, 5 suites)** — every integration suite that requires a
  reachable database (`auth.test.js`, `users.test.js`,
  `security.test.js`, `db-failure.test.js`, `health.test.js`), all
  failing with connection errors, which is the expected result with no
  PostgreSQL server present. This is the pre-existing baseline, not a
  regression introduced by this phase — no application code was
  changed. Once `database/scripts/migrate.js` has been run against a
  real `clario_db`, and `DATABASE_URL` in the real environment's `.env`
  points at it (using `clario_app`'s credentials), re-run `npm test`
  and this integration suite should be the next thing verified.

`npm run lint` and `npm run build` were not run because neither script
exists in `package.json` — only `start`, `dev`, `test`, and
`test:coverage` are defined. `npm audit` could not run (no network in
this sandbox).

## Backend compatibility (Phase 9 Step 15)

Verified against the actual source, not just the approved design
document:

- `src/repositories/auth.repository.js` and
  `src/repositories/user.repository.js` query `users` for exactly:
  `user_id, email, password_hash, role, created_at, updated_at` — all
  present with matching semantics in `002_users.sql`.
- `INSERT INTO users (email, password_hash) VALUES ($1, $2)` relies on
  `user_id`, `role`, `email_verified`, `created_at`, `updated_at` all
  having defaults — they do.
- `auth.service.js` catches Postgres error code `23505`
  (`unique_violation`) on duplicate email — `users_email_key UNIQUE
  (email)` (via the `citext` domain) produces exactly that code.
- No column-name or type mismatch was found between the existing
  backend code and this schema. No backend code changes were required
  or made.

## `.env.example`

Already documents `DATABASE_URL` in the
`postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME` form pointing at
`clario_db` — no changes were needed there. Point it at `clario_app`'s
credentials in real environments, never at an owner/superuser role.

## Files created

```
database/migrations/001_extensions_and_types.sql
database/migrations/002_users.sql
database/migrations/003_profiles.sql
database/migrations/004_skills.sql
database/migrations/005_profile_skills.sql
database/migrations/006_experiences.sql
database/migrations/007_experience_skills.sql
database/migrations/008_educations.sql
database/migrations/009_projects.sql
database/migrations/010_project_skills.sql
database/migrations/011_certifications.sql
database/migrations/012_career_targets.sql
database/migrations/013_target_skills.sql
database/migrations/014_documents.sql
database/migrations/015_opportunities.sql
database/migrations/016_opportunity_skills.sql
database/migrations/017_analyses.sql
database/migrations/018_skill_gaps.sql
database/migrations/019_career_alignments.sql
database/migrations/020_interviews.sql
database/migrations/021_interview_questions.sql
database/migrations/022_interview_answers.sql
database/migrations/023_interview_evaluations.sql
database/migrations/024_roles_and_grants.sql
database/seeds/development.sql
database/scripts/migrate.js
database/scripts/seed.js
database/README.md
```

No existing file was modified — no mismatch was found that required
changing application code (see "Backend compatibility" above), and
`.env.example` already matched.
