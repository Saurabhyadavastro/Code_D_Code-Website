/**
 * Security and Validation Middleware for Code_d_Code Backend
 * Provides rate limiting, input sanitization, and security headers
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Rate limiting configuration
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for tests and localhost in development
    skip: (req) => {
      return process.env.NODE_ENV === 'test' || 
             (process.env.NODE_ENV === 'development' && 
             (req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1'));
    }
  });
};

/**
 * General API rate limiting
 */
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

/**
 * Strict rate limiting for form submissions
 */
const formSubmissionLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  5, // limit each IP to 5 form submissions per hour
  'Too many form submissions from this IP, please try again later.'
);

/**
 * Very strict rate limiting for authentication endpoints
 */
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 auth requests per windowMs
  'Too many authentication attempts from this IP, please try again later.'
);

/**
 * Security headers configuration
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Remove potentially harmful characters from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }

  if (req.query) {
    sanitizeObject(req.query);
  }

  next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    // Log different levels based on status code
    if (res.statusCode >= 500) {
      console.error('🔥 Server Error:', logData);
    } else if (res.statusCode >= 400) {
      console.warn('⚠️  Client Error:', logData);
    } else {
      console.log('📝 Request:', logData);
    }
  });
  
  next();
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('💥 Unhandled Error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error. Please try again later.',
      ...(isDevelopment && { error: err.message })
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors,
      ...(isDevelopment && { stack: err.stack })
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      ...(isDevelopment && { error: err.message })
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { 
      stack: err.stack,
      details: err 
    })
  });
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'GET /': 'API health check',
      'POST /api/contact': 'Submit contact form',
      'GET /api/contact': 'Get contact submissions (admin)',
      'POST /api/membership': 'Submit membership application',
      'GET /api/membership': 'Get membership applications (admin)',
      'GET /api/stats': 'Get dashboard statistics'
    }
  });
};

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5500', // Live Server
      'https://codedcode.tech', // Your custom domain
      'https://www.codedcode.tech', // Your custom domain with www
      'https://saurabhyadavastro.github.io', // GitHub Pages
      'https://saurabhyadavastro.github.io/Code_D_Code-Website', // GitHub Pages with repo path
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count']
};

/**
 * Health check endpoint
 */
const healthCheck = async (req, res) => {
  try {
    const { testConnection } = require('../config/database');
    const dbConnected = await testConnection();
    
    res.json({
      success: true,
      message: 'Code_d_Code Backend API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: dbConnected ? 'connected' : 'disconnected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: error.message
    });
  }
};

module.exports = {
  generalLimiter,
  formSubmissionLimiter,
  authLimiter,
  securityHeaders,
  sanitizeInput,
  requestLogger,
  errorHandler,
  notFoundHandler,
  corsOptions,
  healthCheck
};
