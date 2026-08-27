#!/usr/bin/env node
// database/scripts/migrate.js
//
// Minimal, dependency-free migration runner. No new migration
// framework was introduced (none existed in the project - see
// database/README.md "Migration process") - this just runs every
// .sql file in database/migrations/ in filename order, inside a
// single connection, stopping at the first error.
//
// This intentionally does NOT track "already applied" migrations in
// a table (e.g. schema_migrations) yet - every migration in this
// directory is written to be safe to re-run (CREATE TABLE IF NOT
// EXISTS, CREATE INDEX IF NOT EXISTS, guarded DO blocks), so re-running
// the whole set is currently idempotent. If migrations stop being
// safely re-runnable, add tracking before that changes.
//
// Usage:
//   DATABASE_URL=postgresql://... node database/scripts/migrate.js
//
// Requires an ADMIN/OWNER connection (able to run DDL, CREATE ROLE,
// CREATE EXTENSION) - not the clario_app application role.

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error(`No .sql files found in ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    for (const file of files) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, "utf8");
      process.stdout.write(`Applying ${file} ... `);
      await client.query(sql);
      console.log("ok");
    }
    console.log(`\nApplied ${files.length} migration file(s) successfully.`);
  } catch (err) {
    console.error("\nMigration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
