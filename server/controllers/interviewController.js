// ============================================
// Interview Notes Controller
// ============================================
// Students record their interview experiences after each round.
// This becomes their personal interview journal for future reference.

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
// GET /api/interviews
// ============================================
const getInterviewNotes = async (req, res) => {
  try {
    const studentId = await getOrCreateStudentId(req.user.id);

    const { page, limit, offset } = getPagination(req.query);
    const { search, difficulty } = req.query;

    let whereConditions = ['student_id = $1'];
    let params = [studentId];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(company_name ILIKE $${paramIndex} OR round ILIKE $${paramIndex} OR questions ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (difficulty) {
      whereConditions.push(`difficulty = $${paramIndex}`);
      params.push(difficulty);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await db.query(
      `SELECT COUNT(*) FROM interview_notes WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await db.query(
      `SELECT * FROM interview_notes WHERE ${whereClause}
       ORDER BY interview_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ success: true, ...paginatedResponse(rows, total, page, limit) });
  } catch (error) {
    console.error('Get interview notes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch interview notes.' });
  }
};

// ============================================
// POST /api/interviews
// ============================================
const createInterviewNote = async (req, res) => {
  try {
    const studentId = await getOrCreateStudentId(req.user.id);

    const {
      company_name, interview_date, round, questions,
      difficulty, mistakes, feedback, experience, topics_to_revise
    } = req.body;

    const { rows } = await db.query(
      `INSERT INTO interview_notes
       (student_id, company_name, interview_date, round, questions, difficulty, mistakes, feedback, experience, topics_to_revise)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [studentId, company_name, interview_date, round,
       questions, difficulty || 'medium', mistakes, feedback, experience, topics_to_revise]
    );

    res.status(201).json({
      success: true,
      message: 'Interview note saved successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Create interview note error:', error);
    res.status(500).json({ success: false, message: 'Failed to save interview note.' });
  }
};

// ============================================
// PUT /api/interviews/:id
// ============================================
const updateInterviewNote = async (req, res) => {
  try {
    const studentId = await getOrCreateStudentId(req.user.id);

    const {
      company_name, interview_date, round, questions,
      difficulty, mistakes, feedback, experience, topics_to_revise
    } = req.body;

    const { rows } = await db.query(
      `UPDATE interview_notes SET
        company_name = COALESCE($1, company_name),
        interview_date = COALESCE($2, interview_date),
        round = COALESCE($3, round),
        questions = COALESCE($4, questions),
        difficulty = COALESCE($5, difficulty),
        mistakes = COALESCE($6, mistakes),
        feedback = COALESCE($7, feedback),
        experience = COALESCE($8, experience),
        topics_to_revise = COALESCE($9, topics_to_revise)
       WHERE id = $10 AND student_id = $11
       RETURNING *`,
      [company_name, interview_date, round, questions, difficulty,
       mistakes, feedback, experience, topics_to_revise,
       req.params.id, studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview note not found.' });
    }

    res.json({
      success: true,
      message: 'Interview note updated successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Update interview note error:', error);
    res.status(500).json({ success: false, message: 'Failed to update interview note.' });
  }
};

// ============================================
// DELETE /api/interviews/:id
// ============================================
const deleteInterviewNote = async (req, res) => {
  try {
    const studentId = await getOrCreateStudentId(req.user.id);

    const { rows } = await db.query(
      'DELETE FROM interview_notes WHERE id = $1 AND student_id = $2 RETURNING id',
      [req.params.id, studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview note not found.' });
    }

    res.json({ success: true, message: 'Interview note deleted successfully.' });
  } catch (error) {
    console.error('Delete interview note error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete interview note.' });
  }
};

module.exports = { getInterviewNotes, createInterviewNote, updateInterviewNote, deleteInterviewNote };
