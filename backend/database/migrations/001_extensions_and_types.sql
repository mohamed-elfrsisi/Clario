-- 001_extensions_and_types.sql
--
-- Foundation migration: extensions and shared domain types used by
-- every later migration. Must run first.
--
-- DECISIONS (see database/README.md "Design decisions" for full context):
--
-- 1. UUID generation: this schema assumes PostgreSQL 18, which ships a
--    native uuidv7() builtin (RFC 9562 UUID version 7 - timestamp-ordered,
--    which keeps primary-key indexes append-mostly instead of randomly
--    fragmented the way uuidv4() would). All UUID primary keys in this
--    schema default to uuidv7(). If the target server is older than
--    PostgreSQL 18, uuidv7() will not exist and every migration in this
--    directory will fail at CREATE TABLE time - install the `pg_uuidv7`
--    extension (or upgrade to PG18+) before running these migrations.
--
-- 2. Email storage: emails are stored using a `citext`-backed domain
--    (`email_address`) rather than plain TEXT/VARCHAR. citext gives
--    case-insensitive comparison and uniqueness (Some.User@Example.com
--    and some.user@example.com are the same account) without the
--    application having to remember to lowercase on every read/write.
--    A CHECK constraint enforces a basic structural format. This is not
--    full RFC 5322 validation - just a guard against obviously malformed
--    input; real deliverability validation belongs in the application.

CREATE EXTENSION IF NOT EXISTS citext;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_address') THEN
    CREATE DOMAIN email_address AS citext
      CONSTRAINT email_address_format
      CHECK ( VALUE ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' )
      CONSTRAINT email_address_length
      CHECK ( length(VALUE::text) <= 320 );
  END IF;
END $$;

-- Sanity check: fail loudly and immediately if uuidv7() is not available,
-- rather than letting every subsequent migration fail with a confusing
-- "function does not exist" error deep in a CREATE TABLE statement.
DO $$
BEGIN
  PERFORM uuidv7();
EXCEPTION WHEN undefined_function THEN
  RAISE EXCEPTION
    'uuidv7() is not available on this server. This schema requires '
    'PostgreSQL 18+ (native uuidv7 support). Install the pg_uuidv7 '
    'extension or upgrade PostgreSQL before running these migrations.';
END $$;
