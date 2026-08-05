// ============================================
// Admin Controller
// ============================================
// Admin-only endpoints for managing the placement system.
// Protected by auth + roleCheck('admin') middleware.

const db = require('../config/db');
const { getPagination, paginatedResponse } = require('../utils/helpers');

// ============================================
// GET /api/admin/students
// ============================================
const getStudents = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search } = req.query;

    let whereConditions = ["u.role = 'student'"];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR s.college ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await db.query(
      `SELECT COUNT(*) FROM users u JOIN students s ON s.user_id = u.id WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await db.query(
      `SELECT u.id, u.full_name, u.email, u.is_verified, u.created_at,
              s.college, s.branch, s.graduation_year, s.phone,
              (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.id) as total_applications,
              (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.id AND a.status = 'offer') as offers
       FROM users u
       JOIN students s ON s.user_id = u.id
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ success: true, ...paginatedResponse(rows, total, page, limit) });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
};

// ============================================
// GET /api/admin/statistics
// ============================================
const getStatistics = async (req, res) => {
  try {
    const [
      totalStudents,
      totalApplications,
      statusBreakdown,
      topCompanies,
      packageStats,
      monthlyTrends,
      selectedStudents,
      missingSkillsResult
    ] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      db.query('SELECT COUNT(*) FROM applications'),

      db.query(
        `SELECT status, COUNT(*) as count
         FROM applications GROUP BY status ORDER BY count DESC`
      ),

      db.query(
        `SELECT company_name, COUNT(*) as application_count,
                COUNT(*) FILTER (WHERE status = 'offer') as offers
         FROM applications
         GROUP BY company_name
         ORDER BY application_count DESC
         LIMIT 10`
      ),

      db.query(
        `SELECT
           MAX(package) as highest_package,
           MIN(package) FILTER (WHERE package IS NOT NULL AND package != '') as lowest_package,
           COUNT(*) FILTER (WHERE status = 'offer') as total_offers
         FROM applications`
      ),

      db.query(
        `SELECT
           TO_CHAR(created_at, 'Mon YYYY') as month,
           TO_CHAR(created_at, 'YYYY-MM') as month_key,
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'offer') as offers,
           COUNT(*) FILTER (WHERE status = 'rejected') as rejected
         FROM applications
         WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
         GROUP BY TO_CHAR(created_at, 'Mon YYYY'), TO_CHAR(created_at, 'YYYY-MM')
         ORDER BY month_key ASC`
      ),

      db.query(
        `SELECT DISTINCT u.full_name, u.email, s.college,
                a.company_name, a.role, a.package
         FROM applications a
         JOIN students s ON a.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE a.status = 'offer'
         ORDER BY a.package DESC NULLS LAST
         LIMIT 20`
      ),

      // This is a placeholder - real skills analysis would come from AI results
      db.query(
        `SELECT company_name, COUNT(*) as count
         FROM interview_notes
         WHERE topics_to_revise IS NOT NULL AND topics_to_revise != ''
         GROUP BY company_name
         ORDER BY count DESC
         LIMIT 5`
      ),
    ]);

    const totalApps = parseInt(totalApplications.rows[0].count);
    const totalOffers = parseInt(packageStats.rows[0]?.total_offers || 0);
    const avgSuccessRate = totalApps > 0 ? ((totalOffers / totalApps) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          total_students: parseInt(totalStudents.rows[0].count),
          total_applications: totalApps,
          total_offers: totalOffers,
          average_success_rate: parseFloat(avgSuccessRate),
          highest_package: packageStats.rows[0]?.highest_package || 'N/A',
        },
        status_breakdown: statusBreakdown.rows,
        top_companies: topCompanies.rows,
        monthly_trends: monthlyTrends.rows,
        selected_students: selectedStudents.rows,
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics.' });
  }
};

// ============================================
// POST /api/admin/companies
// ============================================
const addCompany = async (req, res) => {
  try {
    const { name, logo_url, website, industry, description, min_cgpa, package, roles, eligibility_criteria } = req.body;

    const parsedMinCgpa = min_cgpa !== undefined && min_cgpa !== '' ? parseFloat(min_cgpa) : 0.00;

    const { rows } = await db.query(
      `INSERT INTO companies (name, logo_url, website, industry, description, min_cgpa, package, roles, eligibility_criteria, created_by, is_admin_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       RETURNING *`,
      [name, logo_url, website, industry, description, parsedMinCgpa, package || null, roles || null, eligibility_criteria || null, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Company added successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Add company error:', error);
    res.status(500).json({ success: false, message: 'Failed to add company.' });
  }
};

// ============================================
// DELETE /api/admin/companies/:id
// ============================================
const deleteCompany = async (req, res) => {
  try {
    const { rows } = await db.query(
      'DELETE FROM companies WHERE id = $1 RETURNING id, name',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    res.json({ success: true, message: `Company "${rows[0].name}" deleted.` });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete company.' });
  }
};

// ============================================
// GET /api/admin/companies
// ============================================
const getCompanies = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const countResult = await db.query('SELECT COUNT(*) FROM companies');
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await db.query(
      `SELECT c.*, u.full_name as created_by_name
       FROM companies c
       LEFT JOIN users u ON c.created_by = u.id
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ success: true, ...paginatedResponse(rows, total, page, limit) });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies.' });
  }
};

module.exports = { getStudents, getStatistics, addCompany, deleteCompany, getCompanies };
