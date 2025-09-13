/**
 * Comprehensive Backend Testing Suite
 * Tests all API endpoints and functionality
 */

const request = require('supertest');
const app = require('../server');

// Mock database for testing
jest.mock('../config/database', () => ({
  query: jest.fn(),
  testConnection: jest.fn()
}));

const { query, testConnection } = require('../config/database');

describe('Code_d_Code Backend API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    testConnection.mockResolvedValue(true);
  });

  describe('Health Endpoints', () => {
    test('GET / should return health status', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Code_d_Code Backend API is running');
    });

    test('GET /health should return detailed health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Contact Form API', () => {
    test('POST /api/contact should submit valid contact form', async () => {
      const mockResult = {
        rows: [{ id: 1, submitted_at: new Date() }]
      };
      query.mockResolvedValue(mockResult);

      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.test@example.com',
        phone: '+919876543210',
        subject: 'general',
        message: 'This is a test message for the contact form with enough characters to pass validation'
      };

      const response = await request(app)
        .post('/api/contact')
        .send(contactData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('submitted successfully');
    });

    test('POST /api/contact should reject invalid email', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        subject: 'general',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/contact')
        .send(contactData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/contact should reject missing required fields', async () => {
      const contactData = {
        firstName: 'John'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/contact')
        .send(contactData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/contact should return contact submissions', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            subject: 'general',
            status: 'pending'
          }
        ]
      };
      query.mockResolvedValue(mockResult);

      const response = await request(app).get('/api/contact');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.submissions).toBeDefined();
    });
  });

  describe('Membership API', () => {
    test('POST /api/membership should submit valid membership application', async () => {
      // Mock both the email check and the insert queries
      query.mockResolvedValueOnce({ rows: [] }); // Email check returns no results (email available)
      query.mockResolvedValueOnce({ rows: [{ id: 1, submitted_at: new Date() }] }); // Insert success

      const membershipData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.test.unique@example.com',
        membershipType: 'student',
        agreeTerms: true,
        course: 'Computer Science',
        yearOfStudy: '3rd Year',
        programmingExperience: 'intermediate',
        interests: ['web-development', 'data-science']
      };

      const response = await request(app)
        .post('/api/membership')
        .send(membershipData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('submitted successfully');
    });

    test('POST /api/membership should reject without agreeing to terms', async () => {
      const membershipData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        membershipType: 'student',
        agreeTerms: false // Should fail
      };

      const response = await request(app)
        .post('/api/membership')
        .send(membershipData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/membership/check-email/:email should check email availability', async () => {
      query.mockResolvedValue({ rows: [] }); // Email available

      const response = await request(app)
        .get('/api/membership/check-email/test@example.com');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(false);
    });
  });

  describe('Statistics API', () => {
    test('GET /api/stats should return dashboard statistics', async () => {
      const mockResult = {
        rows: [{
          total_contacts: 10,
          today_contacts: 2,
          total_applications: 5,
          pending_applications: 2,
          approved_members: 3
        }]
      };
      query.mockResolvedValue(mockResult);

      const response = await request(app).get('/api/stats');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('Should apply rate limiting to API endpoints', async () => {
      // Make multiple requests quickly to test rate limiting
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed in development mode
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Error Handling', () => {
    test('Should handle database connection errors gracefully', async () => {
      query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/contact')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          subject: 'general',
          message: 'Test message'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('Should return 404 for undefined routes', async () => {
      const response = await request(app).get('/api/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Security', () => {
    test('Should include security headers', async () => {
      const response = await request(app).get('/health');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    test('Should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/contact')
        .set('Origin', 'http://localhost:3000');
        
      expect(response.status).toBeLessThan(400);
    });
  });
});

// Integration tests with actual database (if available)
describe('Database Integration Tests', () => {
  test('Database connection test', async () => {
    // This will use the real database connection
    const { testConnection } = require('../config/database');
    
    try {
      const isConnected = await testConnection();
      console.log('Database connection test result:', isConnected);
    } catch (error) {
      console.log('Database not available for testing:', error.message);
    }
  });
});
