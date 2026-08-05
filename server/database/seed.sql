-- ============================================
-- CareerFlow Seed Data
-- ============================================
-- Sample data for development and testing.
-- Creates a default admin user.
-- Password: Admin@123 (bcrypt hashed)

-- Default Admin User
-- Email: admin@careerflow.com
-- Password: Admin@123
INSERT INTO users (id, email, password, full_name, role, is_verified)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@careerflow.com',
  '$2a$12$HKdV3eoNfFhlJqk/OzpKTuvSWtqKxcYp6TK0Se/02L3/AHPikSajC',
  'Admin User',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

INSERT INTO admins (user_id, department, designation)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Training & Placement Cell',
  'Placement Coordinator'
) ON CONFLICT (user_id) DO NOTHING;
