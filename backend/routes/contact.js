/**
 * Contact Form Routes for Code_d_Code Backend
 * Handles contact form submissions with validation and storage
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

/**
 * Validation rules for contact form
 */
const contactValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
    
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),
    
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
    
  body('subject')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Subject must be between 5 and 100 characters')
    .isIn(['general', 'membership', 'events', 'collaboration', 'technical', 'feedback'])
    .withMessage('Please select a valid subject'),
    
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
];

/**
 * POST /api/contact
 * Submit a new contact form
 */
router.post('/', contactValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, phone, subject, message } = req.body;
    
    // Get client IP and user agent for tracking
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Insert contact submission into database
    const result = await query(
      `INSERT INTO contact_submissions 
       (first_name, last_name, email, phone, subject, message, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, submitted_at`,
      [firstName, lastName, email, phone, subject, message, ipAddress, userAgent]
    );

    const submission = result.rows[0];

    // Log successful submission
    console.log(`📧 New contact submission: ID ${submission.id} from ${email}`);

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        id: submission.id,
        submittedAt: submission.submitted_at
      }
    });

  } catch (error) {
    console.error('❌ Contact form submission error:', error);
    
    // Handle duplicate email constraint (if you add one)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A submission with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again later.'
    });
  }
});

/**
 * GET /api/contact
 * Retrieve contact submissions (admin only - add auth middleware later)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build dynamic query based on filters
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR subject ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM contact_submissions ${whereClause}`,
      queryParams
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get submissions with pagination
    const result = await query(
      `SELECT id, first_name, last_name, email, phone, subject, message, 
              status, submitted_at, ip_address
       FROM contact_submissions 
       ${whereClause}
       ORDER BY submitted_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, parseInt(limit), offset]
    );

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        submissions: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching contact submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact submissions'
    });
  }
});

/**
 * GET /api/contact/:id
 * Get a specific contact submission
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID'
      });
    }

    const result = await query(
      `SELECT id, first_name, last_name, email, phone, subject, message, 
              status, submitted_at, ip_address, user_agent
       FROM contact_submissions 
       WHERE id = $1`,
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching contact submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact submission'
    });
  }
});

/**
 * PATCH /api/contact/:id/status
 * Update contact submission status (admin only)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID'
      });
    }

    if (!['pending', 'read', 'responded'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, read, or responded'
      });
    }

    const result = await query(
      'UPDATE contact_submissions SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating contact submission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

/**
 * GET /api/contact/stats/dashboard
 * Get contact form statistics for dashboard
 */
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN submitted_at >= CURRENT_DATE THEN 1 END) as today_submissions,
        COUNT(CASE WHEN submitted_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_submissions,
        COUNT(CASE WHEN submitted_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as month_submissions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_submissions,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read_submissions,
        COUNT(CASE WHEN status = 'responded' THEN 1 END) as responded_submissions
      FROM contact_submissions
    `);

    const subjectStats = await query(`
      SELECT subject, COUNT(*) as count
      FROM contact_submissions
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY subject
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        overview: stats.rows[0],
        subjectBreakdown: subjectStats.rows
      }
    });

  } catch (error) {
    console.error('❌ Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact statistics'
    });
  }
});

module.exports = router;
