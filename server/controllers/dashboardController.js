// ============================================
// Student Dashboard Controller
// ============================================
// Provides student personal stats and college-level placement overview.

const db = require('../config/db');

const getOrCreateStudentId = async (userId) => {
  let result = await db.query('SELECT id, placement_permission, restriction_reason, is_placed, placed_company, placed_package FROM students WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await db.query(
      'INSERT INTO students (user_id) VALUES ($1) RETURNING id, placement_permission, restriction_reason, is_placed, placed_company, placed_package',
      [userId]
    );
  }
  return result.rows[0];
};

// ============================================
// GET /api/dashboard
// ============================================
const getDashboardStats = async (req, res) => {
  try {
    const studentProfile = await getOrCreateStudentId(req.user.id);
    const studentId = studentProfile.id;

    // Fetch personal stats and college overview concurrently
    const [
      totalAvailableCompRes,
      studentAppsRes,
      statusCountsRes,
      recentAppsRes,
      activeOppsRes,
      collegeStudentsRes,
      collegePlacedRes,
      collegeCompaniesRes,
      collegePackageRes
    ] = await Promise.all([
      // Total active companies available in campus drives
      db.query("SELECT COUNT(*) as count FROM companies WHERE status = 'active' OR status IS NULL"),

      // Total applications submitted by student
      db.query('SELECT COUNT(*) as count FROM applications WHERE student_id = $1', [studentId]),

      // Student application status breakdown
      db.query(`
        SELECT 
          CASE 
            WHEN status = 'offer' THEN 'selected' 
            ELSE status 
          END as status_name, 
          COUNT(*) as count
        FROM applications 
        WHERE student_id = $1 
        GROUP BY status_name
      `, [studentId]),

      // Recent 5 applications by this student
      db.query(`
        SELECT id, company_name, role, package, status, created_at
        FROM applications 
        WHERE student_id = $1
        ORDER BY created_at DESC 
        LIMIT 5
      `, [studentId]),

      // Current / Active placement opportunities (open deadline)
      db.query(`
        SELECT c.id, c.name, c.logo_url, c.package, c.roles, c.min_cgpa, c.deadline, c.location,
               CASE WHEN a.id IS NOT NULL THEN true ELSE false END as has_applied,
               a.status as application_status
        FROM companies c
        LEFT JOIN applications a ON (a.company_id = c.id OR LOWER(a.company_name) = LOWER(c.name)) AND a.student_id = $1
        WHERE c.status = 'active' OR c.status IS NULL
        ORDER BY c.deadline ASC NULLS LAST, c.created_at DESC
        LIMIT 6
      `, [studentId]),

      // College Overview: Total Students
      db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'"),

      // College Overview: Total Students Placed
      db.query(`
        SELECT COUNT(DISTINCT s.id) as count
        FROM students s
        WHERE s.is_placed = true 
           OR EXISTS (SELECT 1 FROM applications a WHERE a.student_id = s.id AND a.status IN ('selected', 'offer'))
      `),

      // College Overview: Total Companies
      db.query('SELECT COUNT(*) as count FROM companies'),

      // College Overview: Package and Offers
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status IN ('selected', 'offer')) as total_offers,
          MAX(package) as highest_package
        FROM applications
      `)
    ]);

    // Parse status counts for the student
    const statusMap = {
      applied: 0,
      shortlisted: 0,
      selected: 0,
      rejected: 0
    };
    statusCountsRes.rows.forEach(r => {
      const key = r.status_name === 'offer' ? 'selected' : r.status_name;
      if (statusMap[key] !== undefined) {
        statusMap[key] = parseInt(r.count);
      }
    });

    const totalApplied = parseInt(studentAppsRes.rows[0].count) || 0;
    const inProgress = (statusMap.applied || 0) + (statusMap.shortlisted || 0);
    const selected = statusMap.selected || 0;
    const rejected = statusMap.rejected || 0;

    // Check placed status: if student has selected application or is_placed flag
    const isPlaced = Boolean(studentProfile.is_placed || selected > 0);

    // College overview calculations
    const collegeTotalStudents = parseInt(collegeStudentsRes.rows[0].count) || 0;
    const collegePlacedStudents = parseInt(collegePlacedRes.rows[0].count) || 0;
    const collegePlacementRate = collegeTotalStudents > 0 
      ? parseFloat(((collegePlacedStudents / collegeTotalStudents) * 100).toFixed(1)) 
      : 0;

    // Calculate realistic average and highest package
    const packagesRes = await db.query(`
      SELECT package FROM companies WHERE package IS NOT NULL AND package != ''
    `);
    let sumLPA = 0;
    let countLPA = 0;
    let maxLPA = 0;
    packagesRes.rows.forEach(r => {
      const match = r.package.match(/(\d+(\.\d+)?)/);
      if (match) {
        const val = parseFloat(match[1]);
        sumLPA += val;
        countLPA++;
        if (val > maxLPA) maxLPA = val;
      }
    });

    const averagePackage = countLPA > 0 ? `${(sumLPA / countLPA).toFixed(1)} LPA` : '6.5 LPA';
    const highestPackage = maxLPA > 0 ? `${maxLPA.toFixed(1)} LPA` : (collegePackageRes.rows[0]?.highest_package || '32.0 LPA');

    res.json({
      success: true,
      data: {
        personal: {
          total_companies_available: parseInt(totalAvailableCompRes.rows[0].count) || 0,
          companies_applied: totalApplied,
          in_progress: inProgress,
          selected: selected,
          rejected: rejected,
          is_placed: isPlaced,
          placed_company: studentProfile.placed_company || null,
          placed_package: studentProfile.placed_package || null,
          placement_permission: studentProfile.placement_permission !== false,
          restriction_reason: studentProfile.restriction_reason || null,
          status_breakdown: statusMap,
        },
        active_opportunities: activeOppsRes.rows,
        recent_applications: recentAppsRes.rows,
        college_overview: {
          placement_percentage: collegePlacementRate,
          total_students_placed: collegePlacedStudents,
          total_companies: parseInt(collegeCompaniesRes.rows[0].count) || 0,
          total_offers: parseInt(collegePackageRes.rows[0]?.total_offers) || 0,
          highest_package: highestPackage,
          average_package: averagePackage,
        }
      }
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
};

module.exports = { getDashboardStats };
