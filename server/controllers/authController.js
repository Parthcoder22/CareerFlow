// ============================================
// Authentication Controller
// ============================================
// Handles: Signup, Login, Email Verification,
// Forgot Password, Reset Password, Get Current User
//
// Security Flow:
// 1. Signup: Hash password → Store → Send verification email
// 2. Login: Find user → Compare hash → Generate JWT → Return token
// 3. Forgot: Generate reset token → Email link
// 4. Reset: Verify token → Hash new password → Update

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { generateToken } = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

// ============================================
// POST /api/auth/signup
// ============================================
const signup = async (req, res) => {
  try {
    const { full_name, email, password, college, branch, graduation_year, cgpa } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = generateToken();

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO users (email, password, full_name, role, verification_token)
         VALUES ($1, $2, $3, 'student', $4)
         RETURNING id, email, full_name, role`,
        [email, hashedPassword, full_name, verificationToken]
      );

      const user = userResult.rows[0];

      await client.query(
        `INSERT INTO students (user_id, college, branch, graduation_year, cgpa)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, college || null, branch || null, graduation_year || null, cgpa ? parseFloat(cgpa) : null]
      );

      await client.query('COMMIT');

      sendVerificationEmail(email, full_name, verificationToken)
        .catch(err => console.warn('Failed to send verification email:', err.message));

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Account created successfully. Please verify your email.',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.'
    });
  }
};

// ============================================
// POST /api/auth/login
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const { rows } = await db.query(
      'SELECT id, email, password, full_name, role, is_verified, avatar_url FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = rows[0];

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// ============================================
// GET /api/auth/verify-email/:token
// ============================================
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const { rows } = await db.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, email',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link.'
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully!'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

// ============================================
// POST /api/auth/forgot-password
// ============================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const { rows } = await db.query(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      [email]
    );

    // Always return success to prevent email enumeration
    if (rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }

    const user = rows[0];
    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    await sendPasswordResetEmail(user.email, user.full_name, resetToken);

    res.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request. Please try again.'
    });
  }
};

// ============================================
// POST /api/auth/reset-password
// ============================================
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const { rows } = await db.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, rows[0].id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
};

// ============================================
// GET /api/auth/me
// ============================================
const getMe = async (req, res) => {
  try {
    let profile = {};

    if (req.user.role === 'student') {
      const { rows } = await db.query(
        `SELECT s.*, u.email, u.full_name, u.role, u.is_verified, u.avatar_url, u.created_at
         FROM students s
         JOIN users u ON s.user_id = u.id
         WHERE u.id = $1`,
        [req.user.id]
      );
      if (rows.length > 0) profile = rows[0];
    } else if (req.user.role === 'admin') {
      const { rows } = await db.query(
        `SELECT a.*, u.email, u.full_name, u.role, u.is_verified, u.avatar_url, u.created_at
         FROM admins a
         JOIN users u ON a.user_id = u.id
         WHERE u.id = $1`,
        [req.user.id]
      );
      if (rows.length > 0) profile = rows[0];
    }

    // Remove sensitive fields
    delete profile.password;

    res.json({
      success: true,
      user: profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile.'
    });
  }
};

// ============================================
// PUT /api/auth/profile
// ============================================
const updateProfile = async (req, res) => {
  try {
    const { full_name, college, branch, graduation_year, cgpa, phone, linkedin_url, github_url, portfolio_url, skills, bio } = req.body;

    // Update user table
    if (full_name) {
      await db.query(
        'UPDATE users SET full_name = $1 WHERE id = $2',
        [full_name, req.user.id]
      );
    }

    // Update student profile
    if (req.user.role === 'student') {
      const parsedCgpa = (cgpa !== undefined && cgpa !== null && cgpa !== '') ? parseFloat(cgpa) : null;
      await db.query(
        `UPDATE students SET
          college = COALESCE($1, college),
          branch = COALESCE($2, branch),
          graduation_year = COALESCE($3, graduation_year),
          cgpa = CASE WHEN $4::numeric IS NOT NULL THEN $4::numeric ELSE cgpa END,
          phone = COALESCE($5, phone),
          linkedin_url = COALESCE($6, linkedin_url),
          github_url = COALESCE($7, github_url),
          portfolio_url = COALESCE($8, portfolio_url),
          skills = COALESCE($9, skills),
          bio = COALESCE($10, bio)
        WHERE user_id = $11`,
        [college, branch, graduation_year, parsedCgpa, phone, linkedin_url, github_url, portfolio_url, skills, bio, req.user.id]
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
};

module.exports = {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
};
