// ============================================
// Public / Student Companies Controller
// ============================================
const db = require('../config/db');

const getPublicCompanies = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, logo_url, website, industry, description, min_cgpa, package, roles, eligibility_criteria, is_admin_verified, created_at
       FROM companies
       ORDER BY min_cgpa DESC, created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies.' });
  }
};

module.exports = { getPublicCompanies };
