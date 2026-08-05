// ============================================
// Role-Based Access Control Middleware
// ============================================
// Design Decision: RBAC ensures that only authorized users can access
// specific resources. For example:
// - Students can only manage their own applications
// - Admins can view all students and manage companies
//
// This is a higher-order function (function that returns a function).
// Usage: router.get('/admin/students', auth, roleCheck('admin'), controller)

const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by the auth middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
};

module.exports = roleCheck;
