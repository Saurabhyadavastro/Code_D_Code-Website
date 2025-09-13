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
  const dbUrl = new URL(connectionString);
  dbConfig = {
    user: dbUrl.username,
    password: dbUrl.password,
    host: dbUrl.hostname,
    port: dbUrl.port,
    database: dbUrl.pathname.split('/')[1],
    ssl: {
      rejectUnauthorized: false
    },
    // Force IPv4 connection to resolve ENETUNREACH error on Render
    family: 4,
    // Additional connection options for better reliability
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 20,
    // Prefer IPv4 over IPv6
    hints: require('dns').ADDRCONFIG
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
