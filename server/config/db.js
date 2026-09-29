// ============================================
// PostgreSQL Database Connection Pool
// ============================================
// Design Decision: We use the 'pg' library with a connection pool instead
// of an ORM like Sequelize or Prisma. This gives us:
// 1. Full control over SQL queries (important for complex JOINs and analytics)
// 2. Better performance (no ORM overhead)
// 3. SQL injection protection via parameterized queries ($1, $2, etc.)
// 4. Easier debugging (you see the actual SQL being executed)
//
// Connection pooling reuses database connections instead of creating new ones
// for each request. This dramatically improves performance under load.

require('dotenv').config();
const { Pool } = require('pg');

const isLocal = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 20,              // Maximum 20 connections in the pool
  idleTimeoutMillis: 30000,  // Close idle connections after 30 seconds
  connectionTimeoutMillis: 15000, // 15s timeout to handle serverless cold-starts (Neon)
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Log successful connection
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL database');
});

// Log errors on idle clients without crashing the server process
pool.on('error', (err) => {
  console.warn('⚠️ PostgreSQL pool idle client warning (auto-reconnecting):', err.message);
});

// Helper: Execute a parameterized query
// Usage: const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
const query = (text, params) => pool.query(text, params);

// Helper: Get a client for transactions
// Usage: const client = await db.getClient();
//        await client.query('BEGIN');
//        ... multiple queries ...
//        await client.query('COMMIT');
//        client.release();
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
