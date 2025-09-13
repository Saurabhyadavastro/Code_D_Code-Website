-- Database Schema for Code_d_Code Club Website Backend
-- Run these commands in your PostgreSQL database (via Render dashboard or pgAdmin)

-- Create database (if needed - usually created automatically by Render)
-- CREATE DATABASE code_d_code_db;

-- Contact Form Submissions Table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'responded')),
    
    -- Indexes for better query performance
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for contact_submissions
CREATE INDEX IF NOT EXISTS idx_contact_submitted_at ON contact_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_submissions(email);

-- Membership Applications Table
CREATE TABLE IF NOT EXISTS membership_applications (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    student_id VARCHAR(20),
    course VARCHAR(100),
    year_of_study VARCHAR(20),
    branch VARCHAR(100),
    membership_type VARCHAR(20) NOT NULL CHECK (membership_type IN ('student', 'alumni')),
    programming_experience VARCHAR(20) CHECK (programming_experience IN ('beginner', 'intermediate', 'advanced')),
    interests TEXT[], -- Array of interests
    github_profile VARCHAR(200),
    linkedin_profile VARCHAR(200),
    why_join TEXT,
    previous_experience TEXT,
    expectations TEXT,
    heard_about_us VARCHAR(100),
    agree_terms BOOLEAN NOT NULL DEFAULT false,
    newsletter_subscribe BOOLEAN DEFAULT true,
    ip_address INET,
    user_agent TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reviewing')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(100),
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_github CHECK (github_profile IS NULL OR github_profile ~* '^https?://github\.com/[a-zA-Z0-9_-]+/?$'),
    CONSTRAINT valid_linkedin CHECK (linkedin_profile IS NULL OR linkedin_profile ~* '^https?://(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+/?$')
);

-- Create indexes for membership_applications
CREATE INDEX IF NOT EXISTS idx_membership_submitted_at ON membership_applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_membership_status ON membership_applications(status);
CREATE INDEX IF NOT EXISTS idx_membership_email ON membership_applications(email);
CREATE INDEX IF NOT EXISTS idx_membership_type ON membership_applications(membership_type);

-- Event Registrations Table (for future use)
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(200) NOT NULL,
    participant_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    college VARCHAR(200),
    year_of_study VARCHAR(20),
    branch VARCHAR(100),
    team_name VARCHAR(100),
    team_size INTEGER DEFAULT 1,
    dietary_preferences TEXT,
    special_requirements TEXT,
    emergency_contact VARCHAR(20),
    registration_fee_paid BOOLEAN DEFAULT false,
    payment_reference VARCHAR(100),
    ip_address INET,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'attended')),
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for event_registrations
CREATE INDEX IF NOT EXISTS idx_event_name ON event_registrations(event_name);
CREATE INDEX IF NOT EXISTS idx_event_registered_at ON event_registrations(registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_status ON event_registrations(status);

-- Admin Users Table (for future admin panel)
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'moderator', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES admin_users(id),
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Insert default admin user (password: admin123 - CHANGE THIS IN PRODUCTION!)
-- Password hash for 'admin123' using bcrypt with 12 rounds
INSERT INTO admin_users (username, email, password_hash, full_name, role) 
VALUES ('admin', 'admin@codedcode.tech', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5CoykNZ.DGWqq', 'Code_d_Code Admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Statistics View for Dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM contact_submissions) as total_contacts,
    (SELECT COUNT(*) FROM contact_submissions WHERE submitted_at >= CURRENT_DATE) as today_contacts,
    (SELECT COUNT(*) FROM membership_applications) as total_applications,
    (SELECT COUNT(*) FROM membership_applications WHERE status = 'pending') as pending_applications,
    (SELECT COUNT(*) FROM membership_applications WHERE status = 'approved') as approved_members,
    (SELECT COUNT(*) FROM event_registrations) as total_event_registrations;

-- Function to get monthly statistics
CREATE OR REPLACE FUNCTION get_monthly_stats(start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days')
RETURNS TABLE (
    month_year TEXT,
    contact_count BIGINT,
    membership_count BIGINT,
    event_registrations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT generate_series(start_date, CURRENT_DATE, INTERVAL '1 month')::date as month
    )
    SELECT 
        TO_CHAR(m.month, 'YYYY-MM') as month_year,
        COALESCE(c.count, 0) as contact_count,
        COALESCE(mem.count, 0) as membership_count,
        COALESCE(e.count, 0) as event_registrations
    FROM months m
    LEFT JOIN (
        SELECT DATE_TRUNC('month', submitted_at)::date as month, COUNT(*) 
        FROM contact_submissions 
        WHERE submitted_at >= start_date 
        GROUP BY DATE_TRUNC('month', submitted_at)
    ) c ON c.month = m.month
    LEFT JOIN (
        SELECT DATE_TRUNC('month', submitted_at)::date as month, COUNT(*) 
        FROM membership_applications 
        WHERE submitted_at >= start_date 
        GROUP BY DATE_TRUNC('month', submitted_at)
    ) mem ON mem.month = m.month
    LEFT JOIN (
        SELECT DATE_TRUNC('month', registered_at)::date as month, COUNT(*) 
        FROM event_registrations 
        WHERE registered_at >= start_date 
        GROUP BY DATE_TRUNC('month', registered_at)
    ) e ON e.month = m.month
    ORDER BY m.month;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE contact_submissions IS 'Stores all contact form submissions from the website';
COMMENT ON TABLE membership_applications IS 'Stores membership applications with detailed information';
COMMENT ON TABLE event_registrations IS 'Stores event registration data for workshops and hackathons';
COMMENT ON TABLE admin_users IS 'Admin users for backend management system';

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
