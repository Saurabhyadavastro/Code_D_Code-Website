/**
 * Database configuration for Code_d_Code Backend
 * Handles PostgreSQL connection using connection pooling for optimal performance
 */

const { Pool } = require('pg');
const { URL } = require('url');

// Parse the database URL to create a config object
const connectionString = process.env.DATABASE_URL;
let dbConfig;

if (connectionString) {
  // Use connection string directly to avoid IPv6 resolution issues
  dbConfig = {
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    // Force IPv4 connection
    family: 4,
    // Connection pool settings
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 20,
    min: 2
  };
} else {
  // Fallback for local development if DATABASE_URL is not set
  dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'codedcode',
    password: 'password',
    port: 5432,
  };
}

const pool = new Pool(dbConfig);

// Event handlers for monitoring
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err);
  process.exit(-1);
});

/**
 * Test database connection
 * @returns {Promise<boolean>} - True if connection successful
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('🔗 Database connection test successful:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('💥 Database connection test failed:', err.message);
    return false;
  }
};

/**
 * Execute a query with error handling
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('💥 Query error:', { text, error: err.message });
    throw err;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} - Database client
 */
const getClient = async () => {
  return await pool.connect();
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};
