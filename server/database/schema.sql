-- ============================================
-- CareerFlow Database Schema
-- PostgreSQL (Neon Compatible)
-- ============================================
-- Design Decisions:
-- 1. UUID primary keys: Prevents ID enumeration attacks (can't guess /user/2)
-- 2. ON DELETE CASCADE: When a user is deleted, all their data is auto-deleted
-- 3. Indexes on foreign keys and frequently-queried columns for query performance
-- 4. ENUM types for status fields to enforce valid values at DB level
-- 5. Timestamps (created_at, updated_at) for audit trails
-- 6. Normalized design (3NF) to avoid data duplication

-- ============================================
-- Enable UUID extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Custom ENUM Types
-- ============================================
-- Using ENUMs ensures only valid values can be stored.
-- This is better than CHECK constraints for readability.

CREATE TYPE user_role AS ENUM ('student', 'admin');

CREATE TYPE application_status AS ENUM (
  'applied', 'oa', 'technical', 'managerial', 'hr', 'offer', 'rejected', 'withdrawn'
);

CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'very_hard');

CREATE TYPE notification_type AS ENUM (
  'oa_reminder', 'interview_reminder', 'deadline_reminder',
  'offer_received', 'rejected', 'general'
);

-- ============================================
-- 1. USERS TABLE (Base table for all users)
-- ============================================
-- Stores authentication data common to both students and admins.
-- The 'role' field determines which profile table to join.
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast login lookups
CREATE INDEX idx_users_email ON users(email);
-- Index on verification token for email verification
CREATE INDEX idx_users_verification_token ON users(verification_token);
-- Index on reset token for password reset
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- ============================================
-- 2. STUDENTS TABLE (Extended profile for students)
-- ============================================
-- One-to-one relationship with users table.
-- Stores student-specific information like college, branch, etc.
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  college VARCHAR(200),
  branch VARCHAR(100),
  graduation_year INTEGER,
  cgpa NUMERIC(3, 2), -- Grade point average (0.00 to 10.00)
  phone VARCHAR(20),
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  skills TEXT[], -- PostgreSQL array type for skill tags
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_user_id ON students(user_id);

-- ============================================
-- 3. ADMINS TABLE (Extended profile for admins)
-- ============================================
-- One-to-one relationship with users table.
-- Stores admin-specific information.
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department VARCHAR(200),
  designation VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_user_id ON admins(user_id);

-- ============================================
-- 4. COMPANIES TABLE (Company master data)
-- ============================================
-- Stores information about companies that visit for placements.
-- Can be created by both students (for personal tracking) and admins.
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry VARCHAR(100),
  description TEXT,
  min_cgpa NUMERIC(3, 2) DEFAULT 0.00, -- Minimum CGPA requirement for student eligibility
  package VARCHAR(100),               -- e.g. '18.5 LPA'
  roles TEXT,                         -- e.g. 'Software Engineer, Cloud Developer'
  eligibility_criteria TEXT,          -- Eligibility criteria description
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_admin_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_created_by ON companies(created_by);

-- ============================================
-- 5. RESUMES TABLE (Student resume storage)
-- ============================================
-- Stores Cloudinary URLs for uploaded PDF resumes.
-- Students can have multiple resumes for different job types.
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  target_company VARCHAR(200),
  file_url TEXT NOT NULL,          -- Cloudinary URL
  cloudinary_id VARCHAR(255),      -- For deletion from Cloudinary
  version INTEGER DEFAULT 1,
  file_size INTEGER,               -- Size in bytes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resumes_student_id ON resumes(student_id);

-- ============================================
-- 6. APPLICATIONS TABLE (Job application tracking)
-- ============================================
-- Core table: Tracks every company a student applies to.
-- Links to companies and resumes tables.
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  company_logo TEXT,
  role VARCHAR(200) NOT NULL,
  package VARCHAR(100),
  location VARCHAR(200),
  eligibility TEXT,
  job_description TEXT,
  application_link TEXT,
  deadline TIMESTAMP,
  oa_date TIMESTAMP,
  interview_date TIMESTAMP,
  status application_status DEFAULT 'applied',
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_company ON applications(company_name);
CREATE INDEX idx_applications_deadline ON applications(deadline);
CREATE INDEX idx_applications_oa_date ON applications(oa_date);
CREATE INDEX idx_applications_interview_date ON applications(interview_date);

-- ============================================
-- 7. INTERVIEW_ROUNDS TABLE (Interview round tracking)
-- ============================================
-- Tracks individual rounds within an application.
-- Each application can have multiple rounds (OA, Technical, HR, etc.)
CREATE TABLE interview_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  round VARCHAR(100) NOT NULL,
  interview_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interview_rounds_application_id ON interview_rounds(application_id);
CREATE INDEX idx_interview_rounds_student_id ON interview_rounds(student_id);

-- ============================================
-- 8. INTERVIEW_NOTES TABLE (Detailed interview notes)
-- ============================================
-- Students save detailed notes after each interview.
-- This becomes their personal interview journal.
CREATE TABLE interview_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  round_id UUID REFERENCES interview_rounds(id) ON DELETE SET NULL,
  company_name VARCHAR(200) NOT NULL,
  interview_date TIMESTAMP NOT NULL,
  round VARCHAR(100) NOT NULL,
  questions TEXT,
  difficulty difficulty_level DEFAULT 'medium',
  mistakes TEXT,
  feedback TEXT,
  experience TEXT,
  topics_to_revise TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interview_notes_student_id ON interview_notes(student_id);

-- ============================================
-- 9. NOTIFICATIONS TABLE (In-app notifications)
-- ============================================
-- Stores all notifications for users.
-- Read status allows the notification center to show unread count.
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type DEFAULT 'general',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,  -- Optional deep link to relevant page
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 10. EXPERIENCES TABLE (Placement experience portal)
-- ============================================
-- Anonymous placement experiences shared by students.
-- student_id is nullable to support full anonymity.
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  company_name VARCHAR(200) NOT NULL,
  role VARCHAR(200),
  rounds TEXT,
  questions TEXT,
  difficulty difficulty_level DEFAULT 'medium',
  tips TEXT,
  experience TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_experiences_company ON experiences(company_name);
CREATE INDEX idx_experiences_created_at ON experiences(created_at DESC);

-- ============================================
-- 11. BOOKMARKS TABLE (Bookmarked experiences)
-- ============================================
-- Many-to-many relationship between students and experiences.
-- Unique constraint prevents double-bookmarking.
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, experience_id)  -- Prevent duplicate bookmarks
);

CREATE INDEX idx_bookmarks_student_id ON bookmarks(student_id);
CREATE INDEX idx_bookmarks_experience_id ON bookmarks(experience_id);

-- ============================================
-- 12. LIKES TABLE (Liked experiences)
-- ============================================
-- Many-to-many relationship between students and experiences.
-- Unique constraint prevents double-liking.
-- Trigger updates likes_count on the experiences table.
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, experience_id)  -- Prevent duplicate likes
);

CREATE INDEX idx_likes_student_id ON likes(student_id);
CREATE INDEX idx_likes_experience_id ON likes(experience_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp on any row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_rounds_updated_at BEFORE UPDATE ON interview_rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_notes_updated_at BEFORE UPDATE ON interview_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at BEFORE UPDATE ON experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update likes_count when a like is added or removed
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE experiences SET likes_count = likes_count + 1 WHERE id = NEW.experience_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE experiences SET likes_count = likes_count - 1 WHERE id = OLD.experience_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();
