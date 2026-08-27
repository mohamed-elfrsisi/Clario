-- 024_roles_and_grants.sql
--
-- Creates the application role and grants it exactly the permissions
-- the Node.js backend needs - nothing more. This role is what
-- DATABASE_URL should authenticate as; the backend must never connect
-- as a PostgreSQL superuser.
--
-- This migration deliberately does NOT set a password (`CREATE ROLE
-- ... LOGIN` with no PASSWORD clause). Set the password out-of-band,
-- once, via psql or your provisioning tool:
--
--   ALTER ROLE clario_app WITH PASSWORD '<generated-secret>';
--
-- and put the resulting connection string in a real (untracked) .env -
-- never in this migration, never in Git.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'clario_app') THEN
    CREATE ROLE clario_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

-- Connection + schema usage.
GRANT CONNECT ON DATABASE clario_db TO clario_app;
GRANT USAGE ON SCHEMA public TO clario_app;

-- Row-level data access: the application reads/writes rows in every
-- table but never needs to alter table structure, drop tables, or
-- manage roles/extensions - that stays with the migration-running
-- owner role.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO clario_app;

-- Sequences: not currently used (all surrogate keys are UUIDs), but
-- granted defensively in case a future migration introduces one
-- (e.g. for order_index bookkeeping) - harmless no-op today.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clario_app;

-- Make sure tables/sequences created by *future* migrations (run as
-- the owner role) automatically pick up the same grants, so nobody
-- has to remember to re-run this file after every new migration.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO clario_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO clario_app;

-- Explicitly NOT granted to clario_app: CREATE on the schema, TRUNCATE,
-- REFERENCES/TRIGGER, or any role/extension/database-level privilege.
-- Running migrations (DDL) is a separate, more-privileged operation
-- that should use the database owner role, not clario_app.
