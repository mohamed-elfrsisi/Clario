#!/usr/bin/env node
// database/scripts/seed.js
//
// Applies database/seeds/development.sql. Safe to run more than once
// (every INSERT uses ON CONFLICT DO NOTHING).
//
// Usage:
//   DATABASE_URL=postgresql://... node database/scripts/seed.js
//
// Never point this at a production DATABASE_URL.

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const SEED_FILE = path.join(__dirname, "..", "seeds", "development.sql");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = fs.readFileSync(SEED_FILE, "utf8");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(sql);
    console.log("Development seed data applied.");
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
