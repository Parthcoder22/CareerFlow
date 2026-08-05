// ============================================
// Application Controller
// ============================================
// Handles CRUD operations for job applications.
// Students can track every company they apply to.

const db = require('../config/db');
const { getPagination, paginatedResponse } = require('../utils/helpers');

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
// GET /api/applications
// ============================================
// Returns paginated, searchable, filterable, sortable list
const getApplications = async (req, res) => {
  try {
    const studentId = await getOrCreateStudentId(req.user.id);
    const { page, limit, offset } = getPagination(req.query);
    const { search, status, location, sort_by, sort_order } = req.query;

    // Build dynamic WHERE clause
    let whereConditions = ['a.student_id = $1'];
    let params = [studentId];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(a.company_name ILIKE $${paramIndex} OR a.role ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (location) {
      whereConditions.push(`a.location ILIKE $${paramIndex}`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Validate sort column to prevent SQL injection
    const validSortColumns = ['created_at', 'company_name', 'deadline', 'status', 'oa_date', 'interview_date'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM applications a WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const { rows } = await db.query(
      `SELECT a.*, r.name as resume_name, r.file_url as resume_url
       FROM applications a
       LEFT JOIN resumes r ON a.resume_id = r.id
       WHERE ${whereClause}
       ORDER BY ${sortColumn} ${sortDirection}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
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
    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { rows } = await db.query(
      `SELECT a.*, r.name as resume_name, r.file_url as resume_url
       FROM applications a
       LEFT JOIN resumes r ON a.resume_id = r.id
       WHERE a.id = $1 AND a.student_id = $2`,
      [req.params.id, studentResult.rows[0].id]
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
const createApplication = async (req, res) => {
  try {
    const studentId = await getOrCreateStudentId(req.user.id);
    const {
      company_name, company_logo, role, package: pkg, location,
      eligibility, job_description, application_link, deadline,
      oa_date, interview_date, status, resume_id, notes
    } = req.body;

    const { rows } = await db.query(
      `INSERT INTO applications
       (student_id, company_name, company_logo, role, package, location, eligibility,
        job_description, application_link, deadline, oa_date, interview_date, status, resume_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [studentId, company_name, company_logo, role, pkg, location, eligibility,
       job_description, application_link, deadline || null, oa_date || null,
       interview_date || null, status || 'applied', resume_id || null, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Application created successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ success: false, message: 'Failed to create application.' });
  }
};

// ============================================
// PUT /api/applications/:id
// ============================================
const updateApplication = async (req, res) => {
  try {
    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const {
      company_name, company_logo, role, package: pkg, location,
      eligibility, job_description, application_link, deadline,
      oa_date, interview_date, status, resume_id, notes
    } = req.body;

    const { rows } = await db.query(
      `UPDATE applications SET
        company_name = COALESCE($1, company_name),
        company_logo = COALESCE($2, company_logo),
        role = COALESCE($3, role),
        package = COALESCE($4, package),
        location = COALESCE($5, location),
        eligibility = COALESCE($6, eligibility),
        job_description = COALESCE($7, job_description),
        application_link = COALESCE($8, application_link),
        deadline = $9,
        oa_date = $10,
        interview_date = $11,
        status = COALESCE($12, status),
        resume_id = $13,
        notes = COALESCE($14, notes)
       WHERE id = $15 AND student_id = $16
       RETURNING *`,
      [company_name, company_logo, role, pkg, location, eligibility,
       job_description, application_link, deadline || null, oa_date || null,
       interview_date || null, status, resume_id || null, notes,
       req.params.id, studentResult.rows[0].id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Create notification if status changed to offer or rejected
    if (status === 'offer' || status === 'rejected') {
      const notifType = status === 'offer' ? 'offer_received' : 'rejected';
      const title = status === 'offer'
        ? `🎉 Offer from ${rows[0].company_name}!`
        : `Update: ${rows[0].company_name}`;
      const message = status === 'offer'
        ? `Congratulations! You received an offer from ${rows[0].company_name} for ${rows[0].role}.`
        : `Your application to ${rows[0].company_name} for ${rows[0].role} has been updated to rejected.`;

      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, $2, $3, $4, '/applications')`,
        [req.user.id, notifType, title, message]
      );
    }

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
const deleteApplication = async (req, res) => {
  try {
    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { rows } = await db.query(
      'DELETE FROM applications WHERE id = $1 AND student_id = $2 RETURNING id',
      [req.params.id, studentResult.rows[0].id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    res.json({ success: true, message: 'Application deleted successfully.' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete application.' });
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
};
