// ============================================
// Input Validation Middleware
// ============================================
// Design Decision: express-validator is used for input validation because:
// 1. Validates and sanitizes input in one step
// 2. Declarative validation rules (chain syntax)
// 3. Prevents malicious input from reaching the database
// 4. Provides clear error messages for the frontend
//
// This middleware runs AFTER the validation rules and checks for errors.

const { validationResult, body, param, query } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ============================================
// Reusable Validation Rules
// ============================================

const signupRules = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('college')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 }).withMessage('College name too long'),
  body('branch')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Branch name too long'),
  body('graduation_year')
    .optional({ values: 'falsy' })
    .isInt({ min: 2020, max: 2035 }).withMessage('Invalid graduation year'),
];

const loginRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const applicationRules = [
  body('company_name')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ max: 200 }).withMessage('Company name too long'),
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isLength({ max: 200 }).withMessage('Role too long'),
  body('package')
    .optional({ values: 'falsy' })
    .trim(),
  body('location')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 }).withMessage('Location too long'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(['applied', 'oa', 'technical', 'managerial', 'hr', 'offer', 'rejected', 'withdrawn'])
    .withMessage('Invalid status value'),
  body('application_link')
    .optional({ values: 'falsy' })
    .trim(),
  body('job_description')
    .optional({ values: 'falsy' })
    .trim(),
  body('eligibility')
    .optional({ values: 'falsy' })
    .trim(),
  body('deadline')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Invalid deadline date'),
  body('oa_date')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Invalid OA date'),
  body('interview_date')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Invalid interview date'),
];

const interviewNoteRules = [
  body('company_name')
    .trim()
    .notEmpty().withMessage('Company name is required'),
  body('interview_date')
    .notEmpty().withMessage('Interview date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('round')
    .trim()
    .notEmpty().withMessage('Round type is required'),
  body('questions')
    .optional()
    .trim(),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'very_hard'])
    .withMessage('Invalid difficulty'),
  body('mistakes')
    .optional()
    .trim(),
  body('feedback')
    .optional()
    .trim(),
  body('experience')
    .optional()
    .trim(),
  body('topics_to_revise')
    .optional()
    .trim(),
];

const experienceRules = [
  body('company_name')
    .trim()
    .notEmpty().withMessage('Company name is required'),
  body('rounds')
    .optional()
    .trim(),
  body('questions')
    .optional()
    .trim(),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'very_hard'])
    .withMessage('Invalid difficulty'),
  body('tips')
    .optional()
    .trim(),
  body('experience')
    .optional()
    .trim(),
  body('is_anonymous')
    .optional()
    .isBoolean().withMessage('is_anonymous must be boolean'),
];

const jdAnalyzeRules = [
  body('job_description')
    .trim()
    .notEmpty().withMessage('Job description is required')
    .isLength({ min: 50 }).withMessage('Job description too short (min 50 chars)')
    .isLength({ max: 10000 }).withMessage('Job description too long (max 10000 chars)'),
];

const forgotPasswordRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
];

const resetPasswordRules = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

module.exports = {
  validate,
  signupRules,
  loginRules,
  applicationRules,
  interviewNoteRules,
  experienceRules,
  jdAnalyzeRules,
  forgotPasswordRules,
  resetPasswordRules,
};
