/**
 * Membership Application Routes for Code_d_Code Backend
 * Handles membership applications with comprehensive validation
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');

/**
 * Validation rules for membership application
 */
const membershipValidation = [
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
    
  body('studentId')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Student ID must not exceed 20 characters'),
    
  body('course')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Course name must not exceed 100 characters'),
    
  body('yearOfStudy')
    .optional()
    .trim()
    .isIn(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Post Graduate', 'PhD'])
    .withMessage('Please select a valid year of study'),
    
  body('branch')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Branch must not exceed 100 characters'),
    
  body('membershipType')
    .trim()
    .isIn(['student', 'alumni'])
    .withMessage('Membership type must be either student or alumni'),
    
  body('programmingExperience')
    .optional()
    .trim()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Programming experience must be beginner, intermediate, or advanced'),
    
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array')
    .custom((interests) => {
      const validInterests = [
        'web-development', 'mobile-development', 'data-science', 
        'machine-learning', 'artificial-intelligence', 'cybersecurity',
        'blockchain', 'devops', 'ui-ux-design', 'competitive-programming',
        'open-source', 'entrepreneurship', 'game-development', 'iot'
      ];
      return interests.every(interest => validInterests.includes(interest));
    })
    .withMessage('Invalid interests selected'),
    
  body('githubProfile')
    .optional()
    .trim()
    .matches(/^https?:\/\/github\.com\/[a-zA-Z0-9_-]+\/?$/)
    .withMessage('Please provide a valid GitHub profile URL'),
    
  body('linkedinProfile')
    .optional()
    .trim()
    .matches(/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/)
    .withMessage('Please provide a valid LinkedIn profile URL'),
    
  body('whyJoin')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Why join response must not exceed 1000 characters'),
    
  body('previousExperience')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Previous experience must not exceed 1000 characters'),
    
  body('expectations')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Expectations must not exceed 1000 characters'),
    
  body('heardAboutUs')
    .optional()
    .trim()
    .isIn(['social-media', 'friends', 'college-notice', 'website', 'event', 'teacher', 'other'])
    .withMessage('Please select how you heard about us'),
    
  body('agreeTerms')
    .isBoolean()
    .custom((value) => value === true)
    .withMessage('You must agree to the terms and conditions'),
    
  body('newsletterSubscribe')
    .optional()
    .isBoolean()
    .withMessage('Newsletter subscription must be true or false')
];

/**
 * POST /api/membership
 * Submit a new membership application
 */
router.post('/', membershipValidation, async (req, res) => {
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

    const {
      firstName, lastName, email, phone, studentId, course, yearOfStudy,
      branch, membershipType, programmingExperience, interests, githubProfile,
      linkedinProfile, whyJoin, previousExperience, expectations, heardAboutUs,
      agreeTerms, newsletterSubscribe
    } = req.body;
    
    // Get client IP and user agent for tracking
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Check if email already exists
    const existingApplication = await query(
      'SELECT id FROM membership_applications WHERE email = $1',
      [email]
    );

    if (existingApplication.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An application with this email already exists'
      });
    }

    // Insert membership application into database
    const result = await query(
      `INSERT INTO membership_applications 
       (first_name, last_name, email, phone, student_id, course, year_of_study,
        branch, membership_type, programming_experience, interests, github_profile,
        linkedin_profile, why_join, previous_experience, expectations, heard_about_us,
        agree_terms, newsletter_subscribe, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) 
       RETURNING id, submitted_at`,
      [
        firstName, lastName, email, phone, studentId, course, yearOfStudy,
        branch, membershipType, programmingExperience, interests, githubProfile,
        linkedinProfile, whyJoin, previousExperience, expectations, heardAboutUs,
        agreeTerms, newsletterSubscribe, ipAddress, userAgent
      ]
    );

    const application = result.rows[0];

    // Log successful application
    console.log(`🎯 New membership application: ID ${application.id} from ${email}`);

    res.status(201).json({
      success: true,
      message: 'Membership application submitted successfully',
      data: {
        id: application.id,
        submittedAt: application.submitted_at,
        message: 'Your application has been received and will be reviewed by our team. You will receive a confirmation email shortly.'
      }
    });

  } catch (error) {
    console.error('❌ Membership application error:', error);
    
    // Handle duplicate email constraint
    if (error.code === '23505' && error.constraint === 'membership_applications_email_key') {
      return res.status(409).json({
        success: false,
        message: 'An application with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit membership application. Please try again later.'
    });
  }
});

/**
 * GET /api/membership
 * Retrieve membership applications (admin only)
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      membershipType, 
      programmingExperience,
      search 
    } = req.query;
    
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

    if (membershipType) {
      whereClause += ` AND membership_type = $${paramIndex}`;
      queryParams.push(membershipType);
      paramIndex++;
    }

    if (programmingExperience) {
      whereClause += ` AND programming_experience = $${paramIndex}`;
      queryParams.push(programmingExperience);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR course ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM membership_applications ${whereClause}`,
      queryParams
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get applications with pagination
    const result = await query(
      `SELECT id, first_name, last_name, email, phone, student_id, course, 
              year_of_study, branch, membership_type, programming_experience, 
              interests, github_profile, linkedin_profile, status, submitted_at,
              approved_at, approved_by
       FROM membership_applications 
       ${whereClause}
       ORDER BY submitted_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, parseInt(limit), offset]
    );

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        applications: result.rows,
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
    console.error('❌ Error fetching membership applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership applications'
    });
  }
});

/**
 * GET /api/membership/:id
 * Get a specific membership application
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    const result = await query(
      `SELECT * FROM membership_applications WHERE id = $1`,
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Membership application not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching membership application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership application'
    });
  }
});

/**
 * PATCH /api/membership/:id/status
 * Update membership application status (admin only)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy, notes } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    if (!['pending', 'approved', 'rejected', 'reviewing'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, approved, rejected, or reviewing'
      });
    }

    let updateQuery = 'UPDATE membership_applications SET status = $1';
    let queryParams = [status];
    let paramIndex = 2;

    if (status === 'approved') {
      updateQuery += `, approved_at = CURRENT_TIMESTAMP, approved_by = $${paramIndex}`;
      queryParams.push(approvedBy || 'Admin');
      paramIndex++;
    }

    if (notes) {
      updateQuery += `, notes = $${paramIndex}`;
      queryParams.push(notes);
      paramIndex++;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, status, approved_at, approved_by`;
    queryParams.push(parseInt(id));

    const result = await query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Membership application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating membership application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status'
    });
  }
});

/**
 * GET /api/membership/stats/dashboard
 * Get membership statistics for dashboard
 */
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN submitted_at >= CURRENT_DATE THEN 1 END) as today_applications,
        COUNT(CASE WHEN submitted_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_applications,
        COUNT(CASE WHEN submitted_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as month_applications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications,
        COUNT(CASE WHEN status = 'reviewing' THEN 1 END) as reviewing_applications,
        COUNT(CASE WHEN membership_type = 'student' THEN 1 END) as student_applications,
        COUNT(CASE WHEN membership_type = 'alumni' THEN 1 END) as alumni_applications
      FROM membership_applications
    `);

    const experienceStats = await query(`
      SELECT programming_experience, COUNT(*) as count
      FROM membership_applications
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY programming_experience
      ORDER BY count DESC
    `);

    const interestStats = await query(`
      SELECT unnest(interests) as interest, COUNT(*) as count
      FROM membership_applications
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY interest
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        overview: stats.rows[0],
        experienceBreakdown: experienceStats.rows,
        popularInterests: interestStats.rows
      }
    });

  } catch (error) {
    console.error('❌ Error fetching membership stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership statistics'
    });
  }
});

/**
 * GET /api/membership/check-email/:email
 * Check if email already exists (for frontend validation)
 */
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const result = await query(
      'SELECT id FROM membership_applications WHERE email = $1',
      [email.toLowerCase()]
    );

    res.json({
      success: true,
      data: {
        exists: result.rows.length > 0,
        message: result.rows.length > 0 
          ? 'An application with this email already exists' 
          : 'Email is available'
      }
    });

  } catch (error) {
    console.error('❌ Error checking email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email availability'
    });
  }
});

module.exports = router;
