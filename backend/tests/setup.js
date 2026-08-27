// tests/setup.js
//
// Why this file exists:
// In normal operation, server.js calls require("dotenv").config() BEFORE
// requiring src/app.js, so process.env.DATABASE_URL (and JWT_SECRET, etc.)
// are populated before the app ever builds its PostgreSQL pool.
//
// Tests never run server.js - they require src/app.js directly through
// Supertest, so that dotenv step would otherwise never happen and every
// database-backed test would silently connect with an empty connection
// string. This file is registered as a Jest "setupFiles" entry so it
// runs first, for every test file, before any test code executes.

require("dotenv").config();
