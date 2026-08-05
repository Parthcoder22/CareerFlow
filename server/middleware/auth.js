// ============================================
// JWT Authentication Middleware
// ============================================
// Design Decision: JWT (JSON Web Tokens) is used instead of sessions because:
// 1. Stateless: No server-side session storage needed (scales horizontally)
// 2. Self-contained: Token carries user info (id, role) - fewer DB lookups
// 3. Cross-domain: Works naturally with separate frontend/backend deployments
// 4. Mobile-friendly: No cookie dependency
//
// Flow:
// 1. Client sends token in Authorization header: "Bearer <token>"
// 2. This middleware extracts and verifies the token
// 3. Decoded user data is attached to req.user
// 4. Next middleware/controller can access req.user.id, req.user.role

const jwt = require('jsonwebtoken');
const db = require('../config/db');

const auth = async (req, res, next) => {
  try {
    // Step 1: Extract token from Authorization header or query param
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Step 2: Verify token using JWT_SECRET
    // This also checks expiration automatically
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 3: Verify user still exists in database
    // (handles case where user was deleted after token was issued)
    const { rows } = await db.query(
      'SELECT id, email, role, full_name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    // Step 4: Attach user to request object
    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

module.exports = auth;
