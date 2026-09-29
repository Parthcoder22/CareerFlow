// ============================================
// Admin / TNP Controller
// ============================================
// Central placement authority management for college T&P cell.
// Protected by auth + roleCheck('admin') middleware.

const db = require('../config/db');
const { getPagination, paginatedResponse } = require('../utils/helpers');

// ============================================
// GET /api/admin/statistics
// ============================================
const getStatistics = async (req, res) => {
  try {
    const [
      totalStudentsRes,
      allowedStudentsRes,
      totalAppsRes,
      placedStudentsRes,
      totalCompaniesRes,
      statusBreakdownRes,
      topCompaniesRes,
      packageStatsRes,
      monthlyTrendsRes,
      selectedStudentsRes,
      companyWiseRes
    ] = await Promise.all([
      // Total registered students
      db.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),

      // Students eligible / allowed to apply
      db.query(`
        SELECT COUNT(*) 
        FROM users u 
        LEFT JOIN students s ON s.user_id = u.id 
        WHERE u.role = 'student' AND COALESCE(s.placement_permission, true) = true
      `),

      // Total applications submitted
      db.query('SELECT COUNT(*) FROM applications'),

      // Total students placed
      db.query(`
        SELECT COUNT(DISTINCT s.id) 
        FROM students s 
        WHERE s.is_placed = true 
           OR EXISTS (SELECT 1 FROM applications a WHERE a.student_id = s.id AND a.status IN ('selected', 'offer'))
      `),

      // Total companies
      db.query('SELECT COUNT(*) FROM companies'),

      // Status breakdown
      db.query(`
        SELECT 
          CASE 
            WHEN status = 'offer' THEN 'selected' 
            ELSE status 
          END as status_name, 
          COUNT(*) as count
        FROM applications 
        GROUP BY status_name
      `),

      // Top companies by applicants
      db.query(`
        SELECT company_name, COUNT(*) as application_count,
               COUNT(*) FILTER (WHERE status IN ('selected', 'offer')) as selected_count
        FROM applications
        GROUP BY company_name
        ORDER BY application_count DESC
        LIMIT 8
      `),

      // Packages and offers
      db.query(`
        SELECT 
          MAX(package) as highest_package,
          COUNT(*) FILTER (WHERE status IN ('selected', 'offer')) as total_offers
        FROM applications
      `),

      // Monthly placement trend
      db.query(`
        SELECT
          TO_CHAR(created_at, 'Mon YYYY') as month,
          TO_CHAR(created_at, 'YYYY-MM') as month_key,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status IN ('selected', 'offer')) as selected,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected
        FROM applications
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'Mon YYYY'), TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month_key ASC
      `),

      // Recent selected students list (Wall of Fame)
      db.query(`
        SELECT DISTINCT u.full_name, u.email, s.college, s.branch, s.cgpa,
               a.company_name, a.role, a.package, a.updated_at
        FROM applications a
        JOIN students s ON a.student_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE a.status IN ('selected', 'offer')
        ORDER BY a.updated_at DESC
        LIMIT 10
      `),

      // Detailed company-wise placement stats
      db.query(`
        SELECT 
          c.id as company_id,
          c.name as company_name,
          c.logo_url,
          c.package,
          c.min_cgpa,
          c.roles,
          c.status as drive_status,
          COUNT(a.id) as total_applicants,
          COUNT(a.id) FILTER (WHERE a.status = 'shortlisted') as shortlisted,
          COUNT(a.id) FILTER (WHERE a.status IN ('selected', 'offer')) as selected,
          COUNT(a.id) FILTER (WHERE a.status = 'rejected') as rejected,
          CASE 
            WHEN COUNT(a.id) > 0 
            THEN ROUND((COUNT(a.id) FILTER (WHERE a.status IN ('selected', 'offer'))::numeric / COUNT(a.id)::numeric) * 100, 1)
            ELSE 0.0
          END as selection_rate
        FROM companies c
        LEFT JOIN applications a ON (a.company_id = c.id OR LOWER(a.company_name) = LOWER(c.name))
        GROUP BY c.id, c.name, c.logo_url, c.package, c.min_cgpa, c.roles, c.status
        ORDER BY total_applicants DESC, selected DESC
      `)
    ]);

    const totalStudents = parseInt(totalStudentsRes.rows[0].count) || 0;
    const eligibleStudents = parseInt(allowedStudentsRes.rows[0].count) || 0;
    const totalApps = parseInt(totalAppsRes.rows[0].count) || 0;
    const placedStudents = parseInt(placedStudentsRes.rows[0].count) || 0;
    const unplacedStudents = Math.max(0, totalStudents - placedStudents);
    const totalOffers = parseInt(packageStatsRes.rows[0]?.total_offers) || 0;
    const placementRate = totalStudents > 0 ? parseFloat(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;

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
    const highestPackage = maxLPA > 0 ? `${maxLPA.toFixed(1)} LPA` : (packageStatsRes.rows[0]?.highest_package || '32.0 LPA');

    // Package distribution brackets
    const packageDistribution = [
      { range: '< 8 LPA', count: 0 },
      { range: '8 - 15 LPA', count: 0 },
      { range: '15 - 25 LPA', count: 0 },
      { range: '25+ LPA', count: 0 }
    ];
    packagesRes.rows.forEach(r => {
      const match = r.package.match(/(\d+(\.\d+)?)/);
      if (match) {
        const val = parseFloat(match[1]);
        if (val < 8) packageDistribution[0].count++;
        else if (val <= 15) packageDistribution[1].count++;
        else if (val <= 25) packageDistribution[2].count++;
        else packageDistribution[3].count++;
      }
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_students: totalStudents,
          eligible_students: eligibleStudents,
          total_applications: totalApps,
          placed_students: placedStudents,
          unplaced_students: unplacedStudents,
          placement_percentage: placementRate,
          total_companies: parseInt(totalCompaniesRes.rows[0].count) || 0,
          total_offers: totalOffers,
          highest_package: highestPackage,
          average_package: averagePackage,
        },
        status_breakdown: statusBreakdownRes.rows,
        top_companies: topCompaniesRes.rows,
        monthly_trends: monthlyTrendsRes.rows,
        selected_students: selectedStudentsRes.rows,
        company_wise_stats: companyWiseRes.rows,
        package_distribution: packageDistribution
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics.' });
  }
};

// ============================================
// GET /api/admin/students
// ============================================
const getStudents = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, branch, placement_status, permission, min_cgpa, company } = req.query;

    let whereConditions = ["u.role = 'student'"];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR s.college ILIKE $${paramIndex} OR s.branch ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (branch && branch !== 'all') {
      whereConditions.push(`s.branch ILIKE $${paramIndex}`);
      params.push(`%${branch}%`);
      paramIndex++;
    }

    if (min_cgpa && min_cgpa !== '') {
      whereConditions.push(`COALESCE(s.cgpa, 0) >= $${paramIndex}`);
      params.push(parseFloat(min_cgpa));
      paramIndex++;
    }

    if (permission && permission !== 'all') {
      const isAllowed = permission === 'allowed';
      whereConditions.push(`COALESCE(s.placement_permission, true) = $${paramIndex}`);
      params.push(isAllowed);
      paramIndex++;
    }

    if (placement_status && placement_status !== 'all') {
      if (placement_status === 'placed') {
        whereConditions.push(`(s.is_placed = true OR EXISTS (SELECT 1 FROM applications a WHERE a.student_id = s.id AND a.status IN ('selected', 'offer')))`);
      } else if (placement_status === 'unplaced') {
        whereConditions.push(`(s.is_placed = false OR s.is_placed IS NULL) AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.student_id = s.id AND a.status IN ('selected', 'offer'))`);
      }
    }

    if (company && company !== '') {
      whereConditions.push(`EXISTS (SELECT 1 FROM applications a WHERE a.student_id = s.id AND a.company_name ILIKE $${paramIndex})`);
      params.push(`%${company}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await db.query(
      `SELECT COUNT(*) FROM users u LEFT JOIN students s ON s.user_id = u.id WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await db.query(
      `SELECT 
         u.id as user_id, 
         s.id as student_id,
         u.full_name, 
         u.email, 
         u.is_verified, 
         u.created_at,
         s.college, 
         s.branch, 
         s.graduation_year, 
         s.cgpa, 
         s.phone,
         COALESCE(s.placement_permission, true) as placement_permission,
         s.restriction_reason,
         CASE 
           WHEN s.is_placed = true OR (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.id AND a.status IN ('selected', 'offer')) > 0 
           THEN true 
           ELSE false 
         END as is_placed,
         s.placed_company,
         s.placed_package,
         (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.id) as total_applications,
         (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.id AND a.status IN ('selected', 'offer')) as offers
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
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
// GET /api/admin/students/:id
// ============================================
// Detailed student profile view for admin
const getStudentDetails = async (req, res) => {
  try {
    const studentIdOrUserId = req.params.id;

    const studentRes = await db.query(`
      SELECT 
        u.id as user_id,
        s.id as student_id,
        u.full_name,
        u.email,
        u.avatar_url,
        u.created_at as joined_date,
        s.college,
        s.branch,
        s.graduation_year,
        s.cgpa,
        s.phone,
        s.linkedin_url,
        s.github_url,
        s.portfolio_url,
        s.skills,
        s.bio,
        COALESCE(s.placement_permission, true) as placement_permission,
        s.restriction_reason,
        s.is_placed,
        s.placed_company,
        s.placed_package
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      WHERE s.id = $1 OR u.id = $1
    `, [studentIdOrUserId]);

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = studentRes.rows[0];

    // Fetch student's resumes
    const resumesRes = await db.query(
      'SELECT id, name, target_company, file_url, created_at FROM resumes WHERE student_id = $1 ORDER BY created_at DESC',
      [student.student_id]
    );

    // Fetch student's full application history
    const applicationsRes = await db.query(`
      SELECT 
        a.id, a.company_name, a.role, a.package, a.status, a.created_at as applied_at,
        r.name as resume_name, r.file_url as resume_url
      FROM applications a
      LEFT JOIN resumes r ON a.resume_id = r.id
      WHERE a.student_id = $1
      ORDER BY a.created_at DESC
    `, [student.student_id]);

    res.json({
      success: true,
      data: {
        profile: student,
        resumes: resumesRes.rows,
        applications: applicationsRes.rows,
      }
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student details.' });
  }
};

// ============================================
// PUT /api/admin/students/:id/permission
// ============================================
// Toggle student's placement application permission
const updateStudentPermission = async (req, res) => {
  try {
    const studentIdOrUserId = req.params.id;
    const { placement_permission, restriction_reason } = req.body;

    const studentRes = await db.query(
      'SELECT id, user_id FROM students WHERE id = $1 OR user_id = $1',
      [studentIdOrUserId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const student = studentRes.rows[0];

    await db.query(`
      UPDATE students 
      SET 
        placement_permission = $1,
        restriction_reason = $2,
        updated_at = NOW()
      WHERE id = $3
    `, [Boolean(placement_permission), restriction_reason || null, student.id]);

    // Send in-app notification to student
    const notifTitle = placement_permission 
      ? '✅ Placement Permission Restored' 
      : '⚠️ Placement Application Permission Restricted';
    const notifMsg = placement_permission
      ? 'Your placement application permission has been restored by the T&P Cell. You can now apply for placement opportunities.'
      : `Your placement application permission has been restricted by the T&P Cell. Reason: ${restriction_reason || 'Policy decision'}. You cannot submit new applications.`;

    await db.query(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES ($1, 'general', $2, $3, '/companies')
    `, [student.user_id, notifTitle, notifMsg]);

    res.json({
      success: true,
      message: `Student permission updated to ${placement_permission ? 'Allowed' : 'Restricted'}.`,
    });
  } catch (error) {
    console.error('Update student permission error:', error);
    res.status(500).json({ success: false, message: 'Failed to update student permission.' });
  }
};

// ============================================
// GET /api/admin/companies
// ============================================
const getCompanies = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, status } = req.query;

    let whereConditions = ['1=1'];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.roles ILIKE $${paramIndex} OR c.industry ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && status !== 'all') {
      whereConditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await db.query(`SELECT COUNT(*) FROM companies c WHERE ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await db.query(
      `SELECT c.*, 
              u.full_name as created_by_name,
              COUNT(a.id) as total_applicants,
              COUNT(a.id) FILTER (WHERE a.status = 'shortlisted') as shortlisted_count,
              COUNT(a.id) FILTER (WHERE a.status IN ('selected', 'offer')) as selected_count,
              COUNT(a.id) FILTER (WHERE a.status = 'rejected') as rejected_count
       FROM companies c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN applications a ON (a.company_id = c.id OR LOWER(a.company_name) = LOWER(c.name))
       WHERE ${whereClause}
       GROUP BY c.id, u.full_name
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ success: true, ...paginatedResponse(rows, total, page, limit) });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies.' });
  }
};

// ============================================
// POST /api/admin/companies
// ============================================
const addCompany = async (req, res) => {
  try {
    const {
      name, logo_url, website, industry, description,
      min_cgpa, package: pkg, roles, eligibility_criteria,
      location, deadline, drive_date, job_description, status
    } = req.body;

    const parsedMinCgpa = min_cgpa !== undefined && min_cgpa !== '' ? parseFloat(min_cgpa) : 0.00;

    const { rows } = await db.query(
      `INSERT INTO companies 
       (name, logo_url, website, industry, description, min_cgpa, package, roles, eligibility_criteria,
        location, deadline, drive_date, job_description, status, created_by, is_admin_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)
       RETURNING *`,
      [
        name, logo_url || null, website || null, industry || 'Technology', description || null,
        parsedMinCgpa, pkg || 'Competitive', roles || 'Software Engineer', eligibility_criteria || null,
        location || 'On-Campus / Hybrid', deadline || null, drive_date || null,
        job_description || null, status || 'active', req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: `Company "${rows[0].name}" added successfully.`,
      data: rows[0],
    });
  } catch (error) {
    console.error('Add company error:', error);
    res.status(500).json({ success: false, message: 'Failed to add company.' });
  }
};

// ============================================
// PUT /api/admin/companies/:id
// ============================================
const updateCompany = async (req, res) => {
  try {
    const {
      name, logo_url, website, industry, description,
      min_cgpa, package: pkg, roles, eligibility_criteria,
      location, deadline, drive_date, job_description, status
    } = req.body;

    const parsedMinCgpa = min_cgpa !== undefined && min_cgpa !== '' ? parseFloat(min_cgpa) : 0.00;

    const { rows } = await db.query(
      `UPDATE companies SET
         name = COALESCE($1, name),
         logo_url = COALESCE($2, logo_url),
         website = COALESCE($3, website),
         industry = COALESCE($4, industry),
         description = COALESCE($5, description),
         min_cgpa = $6,
         package = COALESCE($7, package),
         roles = COALESCE($8, roles),
         eligibility_criteria = COALESCE($9, eligibility_criteria),
         location = COALESCE($10, location),
         deadline = $11,
         drive_date = $12,
         job_description = COALESCE($13, job_description),
         status = COALESCE($14, status),
         updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        name, logo_url, website, industry, description,
        parsedMinCgpa, pkg, roles, eligibility_criteria,
        location, deadline || null, drive_date || null, job_description, status,
        req.params.id
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    res.json({
      success: true,
      message: 'Company details updated successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ success: false, message: 'Failed to update company.' });
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

    res.json({ success: true, message: `Company "${rows[0].name}" deleted successfully.` });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete company.' });
  }
};

// ============================================
// GET /api/admin/companies/:id/applicants
// ============================================
// See all students who applied to a specific company
const getCompanyApplicants = async (req, res) => {
  try {
    const companyId = req.params.id;

    // Get company details
    const compRes = await db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }
    const company = compRes.rows[0];

    const { rows } = await db.query(`
      SELECT 
        a.id as application_id,
        a.status as application_status,
        a.created_at as applied_at,
        a.notes as application_notes,
        s.id as student_id,
        u.id as user_id,
        u.full_name as student_name,
        u.email as student_email,
        s.college,
        s.branch,
        s.graduation_year,
        s.cgpa,
        s.phone,
        COALESCE(s.placement_permission, true) as placement_permission,
        r.id as resume_id,
        r.name as resume_name,
        r.file_url as resume_url
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN resumes r ON a.resume_id = r.id
      WHERE a.company_id = $1 OR LOWER(a.company_name) = LOWER($2)
      ORDER BY a.created_at DESC
    `, [companyId, company.name]);

    res.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        package: company.package,
        roles: company.roles,
        min_cgpa: company.min_cgpa
      },
      data: rows,
    });
  } catch (error) {
    console.error('Get company applicants error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applicants.' });
  }
};

// ============================================
// PUT /api/admin/applications/:id/status
// ============================================
// Admin updates application status: Applied -> Shortlisted -> Selected -> Rejected
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const applicationId = req.params.id;

    const validStatuses = ['applied', 'shortlisted', 'selected', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: applied, shortlisted, selected, or rejected.'
      });
    }

    const { rows } = await db.query(`
      UPDATE applications 
      SET 
        status = $1,
        notes = COALESCE($2, notes),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, notes, applicationId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const application = rows[0];

    // Get student details for notification and placed status
    const studentRes = await db.query(`
      SELECT s.id, s.user_id, u.email, u.full_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `, [application.student_id]);

    if (studentRes.rows.length > 0) {
      const student = studentRes.rows[0];

      // If Selected, mark student as placed in student profile
      if (status === 'selected') {
        await db.query(`
          UPDATE students 
          SET 
            is_placed = true,
            placed_company = $1,
            placed_package = COALESCE($2, placed_package)
          WHERE id = $3
        `, [application.company_name, application.package, student.id]);
      }

      // Send notification to student
      const notifTitles = {
        shortlisted: `📋 Shortlisted by ${application.company_name}`,
        selected: `🎉 Selected by ${application.company_name}!`,
        rejected: `Application Update: ${application.company_name}`,
        applied: `Application Update: ${application.company_name}`
      };

      const notifMessages = {
        shortlisted: `Congratulations! You have been Shortlisted by ${application.company_name} for ${application.role}. Prepare for the next round!`,
        selected: `Congratulations! You have received a final selection offer from ${application.company_name} for ${application.role} (${application.package || ''})!`,
        rejected: `Thank you for your effort. Your application for ${application.company_name} (${application.role}) was not selected. Keep going!`,
        applied: `Your application to ${application.company_name} is currently under review.`
      };

      await db.query(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES ($1, $2, $3, $4, '/applications')
      `, [student.user_id, status === 'selected' ? 'offer_received' : 'general', notifTitles[status], notifMessages[status]]);
    }

    res.json({
      success: true,
      message: `Application status updated to ${status}.`,
      data: application,
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update application status.' });
  }
};

// ============================================
// GET /api/admin/applications
// ============================================
// Central applications view for Admin across all companies
const getAllAdminApplications = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, status, company_id, branch } = req.query;

    let whereConditions = ['1=1'];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR a.company_name ILIKE $${paramIndex} OR a.role ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && status !== 'all') {
      whereConditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (company_id && company_id !== 'all') {
      whereConditions.push(`(a.company_id = $${paramIndex}::uuid)`);
      params.push(company_id);
      paramIndex++;
    }

    if (branch && branch !== 'all') {
      whereConditions.push(`s.branch ILIKE $${paramIndex}`);
      params.push(`%${branch}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const countRes = await db.query(`
      SELECT COUNT(*)
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE ${whereClause}
    `, params);
    const total = parseInt(countRes.rows[0].count);

    const { rows } = await db.query(`
      SELECT 
        a.id as application_id,
        a.company_name,
        a.role,
        a.package,
        a.status,
        a.created_at as applied_at,
        a.notes,
        s.id as student_id,
        u.id as user_id,
        u.full_name as student_name,
        u.email as student_email,
        s.college,
        s.branch,
        s.cgpa,
        r.id as resume_id,
        r.name as resume_name,
        r.file_url as resume_url
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN resumes r ON a.resume_id = r.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      ...paginatedResponse(rows, total, page, limit)
    });
  } catch (error) {
    console.error('Get all admin applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

module.exports = {
  getStatistics,
  getStudents,
  getStudentDetails,
  updateStudentPermission,
  getCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
  getCompanyApplicants,
  updateApplicationStatus,
  getAllAdminApplications,
};
