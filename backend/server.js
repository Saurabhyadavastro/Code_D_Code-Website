/**
 * Code_d_Code Backend Server
 * Main Express server with comprehensive middleware and route setup
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import middleware
const {
  generalLimiter,
  formSubmissionLimiter,
  securityHeaders,
  sanitizeInput,
  requestLogger,
  errorHandler,
  notFoundHandler,
  corsOptions,
  healthCheck
} = require('./middleware/security');

// Import routes
const contactRoutes = require('./routes/contact');
const membershipRoutes = require('./routes/membership');

// Import database configuration
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses (required for Render)
app.set('trust proxy', 1);

// Security middleware (apply first)
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Input sanitization
app.use(sanitizeInput);

// Rate limiting
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/', healthCheck);
app.get('/health', healthCheck);

// API Routes with specific rate limiting
app.use('/api/contact', formSubmissionLimiter, contactRoutes);
app.use('/api/membership', formSubmissionLimiter, membershipRoutes);

// Stats endpoint (combined statistics)
app.get('/api/stats', async (req, res) => {
  try {
    const { query } = require('./config/database');
    
    // Get overview statistics
    const overviewStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM contact_submissions) as total_contacts,
        (SELECT COUNT(*) FROM contact_submissions WHERE submitted_at >= CURRENT_DATE) as today_contacts,
        (SELECT COUNT(*) FROM membership_applications) as total_applications,
        (SELECT COUNT(*) FROM membership_applications WHERE status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM membership_applications WHERE status = 'approved') as approved_members
    `);

    // Get recent activity (last 7 days)
    const recentActivity = await query(`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as contacts
      FROM contact_submissions 
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
    `);

    const recentMemberships = await query(`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as applications
      FROM membership_applications 
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: {
        overview: overviewStats.rows[0],
        recentActivity: {
          contacts: recentActivity.rows,
          memberships: recentMemberships.rows
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// 404 handler for undefined routes
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Graceful server startup with database connection test
 */
const startServer = async () => {
  try {
    console.log('🚀 Starting Code_d_Code Backend Server...');
    
    // Test database connection
    console.log('📊 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
      console.error('💥 Database connection failed in production. Exiting...');
      process.exit(1);
    }
    
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but continuing in development mode');
    }

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📚 Available API Endpoints:');
        console.log('  GET  /              - Health check');
        console.log('  GET  /health        - Detailed health status');
        console.log('  GET  /api/stats     - Dashboard statistics');
        console.log('  POST /api/contact   - Submit contact form');
        console.log('  GET  /api/contact   - Get contact submissions');
        console.log('  POST /api/membership - Submit membership application');
        console.log('  GET  /api/membership - Get membership applications');
        console.log('\n🔧 Development Tips:');
        console.log('  - Set NODE_ENV=development for detailed logs');
        console.log('  - Use tools like Postman to test API endpoints');
        console.log('  - Check /health endpoint for service status');
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          // Close database connections
          const { pool } = require('./config/database');
          await pool.end();
          console.log('📊 Database connections closed');
        } catch (error) {
          console.error('❌ Error closing database connections:', error);
        }
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('💥 Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
