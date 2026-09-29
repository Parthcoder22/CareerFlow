// ============================================
// Application Controller
// ============================================
// Handles student job applications with eligibility, deadline,
// and placement permission validation.
// Status modification is strictly controlled by Admin/TNP.

const db = require('../config/db');
const { getPagination, paginatedResponse } = require('../utils/helpers');

const getOrCreateStudentId = async (userId) => {
  let result = await db.query('SELECT id, cgpa, placement_permission, restriction_reason FROM students WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await db.query(
      'INSERT INTO students (user_id) VALUES ($1) RETURNING id, cgpa, placement_permission, restriction_reason',
      [userId]
    );
  }
  return result.rows[0];
};

// ============================================
// GET /api/applications
// ============================================
// Returns paginated, searchable, filterable list of student's applications
const getApplications = async (req, res) => {
  try {
    const student = await getOrCreateStudentId(req.user.id);
    const studentId = student.id;
    const { page, limit, offset } = getPagination(req.query);
    const { search, status, sort_by, sort_order } = req.query;

    let whereConditions = ['a.student_id = $1'];
    let params = [studentId];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(a.company_name ILIKE $${paramIndex} OR a.role ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && status !== 'all') {
      whereConditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await db.query(
      `SELECT COUNT(*) FROM applications a WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const validSortColumns = ['created_at', 'company_name', 'deadline', 'status'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

    const { rows } = await db.query(
      `SELECT a.*, 
              r.name as resume_name, 
              r.file_url as resume_url,
              c.logo_url as company_logo_url,
              c.website as company_website,
              c.min_cgpa as company_min_cgpa
       FROM applications a
       LEFT JOIN resumes r ON a.resume_id = r.id
       LEFT JOIN companies c ON a.company_id = c.id
       WHERE ${whereClause}
       ORDER BY a.${sortColumn} ${sortDirection}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      student_meta: {
        placement_permission: student.placement_permission !== false,
        restriction_reason: student.restriction_reason || null,
      },
      ...paginatedResponse(rows, total, page, limit),
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

// ============================================
// GET /api/applications/:id
// ============================================
const getApplication = async (req, res) => {
  try {
    const student = await getOrCreateStudentId(req.user.id);

    const { rows } = await db.query(
      `SELECT a.*, r.name as resume_name, r.file_url as resume_url,
              c.logo_url as company_logo_url, c.website as company_website
       FROM applications a
       LEFT JOIN resumes r ON a.resume_id = r.id
       LEFT JOIN companies c ON a.company_id = c.id
       WHERE a.id = $1 AND a.student_id = $2`,
      [req.params.id, student.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch application.' });
  }
};

// ============================================
// POST /api/applications
// ============================================
// Student applies for a placement opportunity
const createApplication = async (req, res) => {
  try {
    const student = await getOrCreateStudentId(req.user.id);
    const studentId = student.id;

    // 1. Validate Placement Application Permission
    if (student.placement_permission === false) {
      return res.status(403).json({
        success: false,
        message: `Your placement application permission has been restricted by the T&P Cell. Reason: ${student.restriction_reason || 'Policy restriction'}.`
      });
    }

    const {
      company_id, company_name, role, package: pkg, location,
      job_description, application_link, deadline, resume_id, notes
    } = req.body;

    // 2. Fetch company details if company_id or company_name provided
    let company = null;
    if (company_id) {
      const compRes = await db.query('SELECT * FROM companies WHERE id = $1', [company_id]);
      if (compRes.rows.length > 0) company = compRes.rows[0];
    } else if (company_name) {
      const compRes = await db.query('SELECT * FROM companies WHERE LOWER(name) = LOWER($1)', [company_name]);
      if (compRes.rows.length > 0) company = compRes.rows[0];
    }

    const targetCompanyId = company ? company.id : (company_id || null);
    const targetCompanyName = company ? company.name : company_name;
    const targetRole = company ? (company.roles || role) : role;
    const targetPackage = company ? (company.package || pkg) : pkg;
    const targetLocation = company ? (company.location || location) : location;
    const targetDeadline = company ? (company.deadline || deadline) : deadline;

    // 3. Check if student has already applied
    const existing = await db.query(
      `SELECT id FROM applications 
       WHERE student_id = $1 AND (
         (company_id IS NOT NULL AND company_id = $2) OR 
         (LOWER(company_name) = LOWER($3))
       )`,
      [studentId, targetCompanyId, targetCompanyName]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `You have already submitted an application for ${targetCompanyName}.`
      });
    }

    // 4. Validate Deadline
    if (targetDeadline && new Date(targetDeadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: `The application deadline for ${targetCompanyName} has passed.`
      });
    }

    // 5. Validate CGPA Cutoff
    if (company && company.min_cgpa) {
      const cutoff = parseFloat(company.min_cgpa);
      const studentCgpa = parseFloat(student.cgpa || 0);
      if (studentCgpa < cutoff) {
        return res.status(400).json({
          success: false,
          message: `Your CGPA (${studentCgpa.toFixed(2)}) is below the minimum required cutoff (${cutoff.toFixed(2)}) for ${targetCompanyName}.`
        });
      }
    }

    // 6. Create Application (always starts with status 'applied')
    const { rows } = await db.query(
      `INSERT INTO applications
       (student_id, company_id, company_name, company_logo, role, package, location,
        job_description, application_link, deadline, status, resume_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'applied', $11, $12)
       RETURNING *`,
      [
        studentId,
        targetCompanyId,
        targetCompanyName,
        company?.logo_url || null,
        targetRole,
        targetPackage,
        targetLocation,
        company?.job_description || job_description || null,
        application_link || company?.website || null,
        targetDeadline || null,
        resume_id || null,
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: `Application submitted successfully for ${targetCompanyName}!`,
      data: rows[0],
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};

// ============================================
// PUT /api/applications/:id
// ============================================
// Student can only update resume attached or notes while application is 'applied'
// Student CANNOT change status (only Admin/TNP can)
const updateApplication = async (req, res) => {
  try {
    const student = await getOrCreateStudentId(req.user.id);
    const { resume_id, notes } = req.body;

    // Check application status
    const currentApp = await db.query(
      'SELECT id, status, company_name FROM applications WHERE id = $1 AND student_id = $2',
      [req.params.id, student.id]
    );

    if (currentApp.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const { rows } = await db.query(
      `UPDATE applications SET
        resume_id = COALESCE($1, resume_id),
        notes = COALESCE($2, notes),
        updated_at = NOW()
       WHERE id = $3 AND student_id = $4
       RETURNING *`,
      [resume_id || null, notes, req.params.id, student.id]
    );

    res.json({
      success: true,
      message: 'Application updated successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ success: false, message: 'Failed to update application.' });
  }
};

// ============================================
// DELETE /api/applications/:id
// ============================================
// Student can withdraw/delete only if still in 'applied' status
const deleteApplication = async (req, res) => {
  try {
    const student = await getOrCreateStudentId(req.user.id);

    const checkApp = await db.query(
      'SELECT id, status FROM applications WHERE id = $1 AND student_id = $2',
      [req.params.id, student.id]
    );

    if (checkApp.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (['shortlisted', 'selected'].includes(checkApp.rows[0].status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw an application that has already been shortlisted or selected by T&P Cell.'
      });
    }

    await db.query(
      'DELETE FROM applications WHERE id = $1 AND student_id = $2',
      [req.params.id, student.id]
    );

    res.json({ success: true, message: 'Application withdrawn successfully.' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ success: false, message: 'Failed to withdraw application.' });
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
};
