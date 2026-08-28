// src/config/database.js
//
// This module creates ONE shared PostgreSQL connection pool for the
// whole application. Every route that needs the database imports
// `pool` from here - nobody should call `new Pool()` anywhere else.
//
// Why one shared pool instead of one per request?
// Opening a connection is relatively slow (network handshake + auth).
// A pool keeps a small set of connections open and ready, and hands
// them out to whichever request needs one, then takes them back when
// the query is done. This module just creates that pool once, when
// the app starts, and every request reuses it.

const { Pool } = require("pg");

// pg automatically reads DATABASE_URL from process.env if we pass
// connectionString. We do NOT log this value anywhere - it contains
// the database password.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Reasonable defaults for local development. These are intentionally
  // small and simple - production pool sizing (for Cloud SQL / Cloud
  // Run) will be revisited when we actually deploy, in a later phase.
  max: 10, // maximum number of connections in the pool
  idleTimeoutMillis: 30000, // close idle connections after 30s
  connectionTimeoutMillis: 5000, // fail fast if PostgreSQL is unreachable
});

// If an already-open, idle connection in the pool unexpectedly errors
// out (e.g. the database restarts), this prevents that from crashing
// the whole Node process. We just log it.
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

// Small helper to check connectivity. Runs the simplest possible
// query ("SELECT 1") just to confirm PostgreSQL responds.
// Does not expose connection details - only true/false plus (server-side
// only) the real error for logging.
async function testConnection() {
  try {
    await pool.query("SELECT 1");
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err };
  }
}

// Runs `fn` inside a single PostgreSQL transaction using one dedicated
// client from the pool. `fn` receives that client and MUST use it
// (not the shared pool) for every query, so all statements run on the
// same connection/transaction. Commits on success, rolls back and
// rethrows on any error. Always releases the client back to the pool.
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testConnection,
  withTransaction,
};
