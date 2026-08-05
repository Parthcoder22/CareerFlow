// ============================================
// Utility Helper Functions
// ============================================

/**
 * Generate a random token for email verification and password reset.
 * Uses crypto for cryptographically secure random bytes.
 */
const crypto = require('crypto');

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Paginate query results.
 * Extracts page and limit from query params with defaults.
 * Returns OFFSET and LIMIT for SQL queries.
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Format pagination response with metadata.
 */
const paginatedResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

module.exports = {
  generateToken,
  getPagination,
  paginatedResponse,
};
