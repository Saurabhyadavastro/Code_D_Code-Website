/**
 * Database configuration for Code_d_Code Backend
 * Handles PostgreSQL connection using connection pooling for optimal performance
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  // SSL configuration for production (Render requires SSL)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool settings for optimal performance
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return error if connection takes longer than 2 seconds
};

// Create connection pool
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
