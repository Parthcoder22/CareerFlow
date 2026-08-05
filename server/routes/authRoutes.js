// ============================================
// Authentication Routes
// ============================================
const express = require('express');
const router = express.Router();
const { signup, login, verifyEmail, forgotPassword, resetPassword, getMe, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, signupRules, loginRules, forgotPasswordRules, resetPasswordRules } = require('../middleware/validate');

// Public routes (with auth rate limiter)
router.post('/signup', authLimiter, signupRules, validate, signup);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordRules, validate, resetPassword);

// Protected routes
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

module.exports = router;
