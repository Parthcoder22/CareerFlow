// ============================================
// Rate Limiting Middleware
// ============================================
// Design Decision: Rate limiting prevents:
// 1. Brute-force attacks on login
// 2. API abuse (excessive requests)
// 3. DDoS attacks (resource exhaustion)
//
// We use different limits for different endpoints:
// - Auth routes: Stricter (20 requests per 15 min) to prevent brute-force
// - General routes: More lenient (200 requests per 15 min)

const rateLimit = require('express-rate-limit');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,                    // 200 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false,       // Disable X-RateLimit-* headers
});

// Stricter limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                     // Only 20 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoint limiter (Gemini API has quotas)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 5,                      // 5 AI requests per minute
  message: {
    success: false,
    message: 'AI analysis rate limit reached. Please wait a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter, aiLimiter };
