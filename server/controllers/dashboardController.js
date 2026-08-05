// ============================================
// Dashboard Controller
// ============================================
// Provides aggregated statistics for the student dashboard.
// Uses SQL aggregate functions for efficient server-side computation.

const db = require('../config/db');

const getOrCreateStudentId = async (userId) => {
  let result = await db.query('SELECT id FROM students WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await db.query(
      'INSERT INTO students (user_id) VALUES ($1) RETURNING id',
      [userId]
    );
  }
  return result.rows[0].id;
};

// ============================================
// GET /api/dashboard
// ============================================
const getDashboardStats = async (req, res) => {
  try {
    const studentId = await getOrCreateStudentId(req.user.id);

    // Get all stats in parallel for performance
    const [
      totalResult,
      statusResult,
      upcomingOAResult,
      upcomingInterviewResult,
      monthlyResult,
      recentResult,
      topCompaniesResult
    ] = await Promise.all([
      // Total applications count
      db.query('SELECT COUNT(*) as total FROM applications WHERE student_id = $1', [studentId]),

      // Count by status
      db.query(
        `SELECT status, COUNT(*) as count
         FROM applications WHERE student_id = $1
         GROUP BY status`,
        [studentId]
      ),

      // Upcoming OAs (next 7 days)
      db.query(
        `SELECT company_name, role, oa_date
         FROM applications
         WHERE student_id = $1 AND oa_date >= CURRENT_DATE AND oa_date <= CURRENT_DATE + INTERVAL '7 days'
           AND status NOT IN ('rejected', 'withdrawn', 'offer')
         ORDER BY oa_date ASC
         LIMIT 5`,
        [studentId]
      ),

      // Upcoming interviews (next 7 days)
      db.query(
        `SELECT company_name, role, interview_date
         FROM applications
         WHERE student_id = $1 AND interview_date >= CURRENT_DATE AND interview_date <= CURRENT_DATE + INTERVAL '7 days'
           AND status NOT IN ('rejected', 'withdrawn', 'offer')
         ORDER BY interview_date ASC
         LIMIT 5`,
        [studentId]
      ),

      // Monthly statistics (last 6 months)
      db.query(
        `SELECT
           TO_CHAR(created_at, 'Mon YYYY') as month,
           TO_CHAR(created_at, 'YYYY-MM') as month_key,
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'offer') as offers,
           COUNT(*) FILTER (WHERE status = 'rejected') as rejected
         FROM applications
         WHERE student_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 months'
         GROUP BY TO_CHAR(created_at, 'Mon YYYY'), TO_CHAR(created_at, 'YYYY-MM')
         ORDER BY month_key ASC`,
        [studentId]
      ),

      // Recent applications (last 5)
      db.query(
        `SELECT id, company_name, role, status, created_at
         FROM applications WHERE student_id = $1
         ORDER BY created_at DESC LIMIT 5`,
        [studentId]
      ),

      // Top applied companies
      db.query(
        `SELECT company_name, COUNT(*) as count
         FROM applications WHERE student_id = $1
         GROUP BY company_name
         ORDER BY count DESC LIMIT 5`,
        [studentId]
      ),
    ]);

    // Parse status counts into an object
    const statusCounts = {};
    statusResult.rows.forEach(row => {
      statusCounts[row.status] = parseInt(row.count);
    });

    const total = parseInt(totalResult.rows[0].total);
    const offers = statusCounts.offer || 0;
    const rejected = statusCounts.rejected || 0;
    const successRate = total > 0 ? ((offers / total) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          total_applications: total,
          offers,
          rejected,
          in_progress: total - offers - rejected - (statusCounts.withdrawn || 0),
          success_rate: parseFloat(successRate),
          upcoming_oa: upcomingOAResult.rows.length,
          upcoming_interviews: upcomingInterviewResult.rows.length,
        },
        status_breakdown: statusCounts,
        upcoming_oa: upcomingOAResult.rows,
        upcoming_interviews: upcomingInterviewResult.rows,
        monthly_stats: monthlyResult.rows,
        recent_applications: recentResult.rows,
        top_companies: topCompaniesResult.rows,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
};

module.exports = { getDashboardStats };
