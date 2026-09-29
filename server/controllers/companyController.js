// ============================================
// Student / Campus Company Drives Controller
// ============================================
const db = require('../config/db');

const getPublicCompanies = async (req, res) => {
  try {
    let studentId = null;
    let studentCgpa = 0.0;
    let placementPermission = true;
    let restrictionReason = null;

    if (req.user) {
      const studentRes = await db.query(
        'SELECT id, cgpa, placement_permission, restriction_reason FROM students WHERE user_id = $1',
        [req.user.id]
      );
      if (studentRes.rows.length > 0) {
        studentId = studentRes.rows[0].id;
        studentCgpa = parseFloat(studentRes.rows[0].cgpa || 0);
        placementPermission = studentRes.rows[0].placement_permission !== false;
        restrictionReason = studentRes.rows[0].restriction_reason;
      }
    }

    const { rows } = await db.query(
      `SELECT 
         c.id, c.name, c.logo_url, c.website, c.industry, c.description,
         c.min_cgpa, c.package, c.roles, c.eligibility_criteria,
         c.location, c.deadline, c.drive_date, c.job_description,
         COALESCE(c.status, 'active') as status,
         c.is_admin_verified, c.created_at,
         CASE WHEN a.id IS NOT NULL THEN true ELSE false END as has_applied,
         a.status as application_status,
         a.created_at as applied_at,
         a.id as application_id
       FROM companies c
       LEFT JOIN applications a ON (a.company_id = c.id OR LOWER(a.company_name) = LOWER(c.name)) AND a.student_id = $1
       ORDER BY c.deadline ASC NULLS LAST, c.created_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      student_meta: {
        student_cgpa: studentCgpa,
        placement_permission: placementPermission,
        restriction_reason: restrictionReason,
      },
      data: rows,
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies.' });
  }
};

module.exports = { getPublicCompanies };
