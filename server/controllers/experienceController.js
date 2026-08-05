// ============================================
// Experience Portal Controller
// ============================================
// Students share placement experiences (optionally anonymously).
// Others can read, search, like, and bookmark experiences.

const db = require('../config/db');
const { getPagination, paginatedResponse } = require('../utils/helpers');

// ============================================
// GET /api/experiences
// ============================================
const getExperiences = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, difficulty, sort_by } = req.query;

    let whereConditions = ['1=1'];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(e.company_name ILIKE $${paramIndex} OR e.role ILIKE $${paramIndex} OR e.experience ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (difficulty) {
      whereConditions.push(`e.difficulty = $${paramIndex}`);
      params.push(difficulty);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    const sortColumn = sort_by === 'likes' ? 'e.likes_count' : 'e.created_at';

    // Get student_id for checking if user has liked/bookmarked
    let studentId = null;
    if (req.user) {
      const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
      if (studentResult.rows.length > 0) studentId = studentResult.rows[0].id;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM experiences e WHERE ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    let query;
    if (studentId) {
      query = `
        SELECT e.*,
          CASE WHEN e.is_anonymous THEN 'Anonymous' ELSE u.full_name END as author_name,
          CASE WHEN l.id IS NOT NULL THEN true ELSE false END as is_liked,
          CASE WHEN b.id IS NOT NULL THEN true ELSE false END as is_bookmarked
        FROM experiences e
        LEFT JOIN students s ON e.student_id = s.id
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN likes l ON l.experience_id = e.id AND l.student_id = $${paramIndex}
        LEFT JOIN bookmarks b ON b.experience_id = e.id AND b.student_id = $${paramIndex}
        WHERE ${whereClause}
        ORDER BY ${sortColumn} DESC
        LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
      `;
      params = [studentId, ...params.slice(0), limit, offset];
      // Fix: rebuild params properly
      const queryParams = [];
      let idx = 1;
      queryParams.push(studentId); // $1 = studentId
      // Rebuild with correct indexing
      const finalParams = [studentId];
      let finalConditions = ['1=1'];
      let fIdx = 2;

      if (search) {
        finalConditions.push(`(e.company_name ILIKE $${fIdx} OR e.role ILIKE $${fIdx} OR e.experience ILIKE $${fIdx})`);
        finalParams.push(`%${search}%`);
        fIdx++;
      }
      if (difficulty) {
        finalConditions.push(`e.difficulty = $${fIdx}`);
        finalParams.push(difficulty);
        fIdx++;
      }

      const finalWhere = finalConditions.join(' AND ');

      const { rows } = await db.query(
        `SELECT e.*,
          CASE WHEN e.is_anonymous THEN 'Anonymous' ELSE u.full_name END as author_name,
          CASE WHEN l.id IS NOT NULL THEN true ELSE false END as is_liked,
          CASE WHEN b.id IS NOT NULL THEN true ELSE false END as is_bookmarked,
          c.min_cgpa as company_min_cgpa,
          c.package as company_package,
          c.logo_url as company_logo
        FROM experiences e
        LEFT JOIN students s ON e.student_id = s.id
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN likes l ON l.experience_id = e.id AND l.student_id = $1
        LEFT JOIN bookmarks b ON b.experience_id = e.id AND b.student_id = $1
        LEFT JOIN companies c ON LOWER(c.name) = LOWER(e.company_name)
        WHERE ${finalWhere}
        ORDER BY ${sortColumn} DESC
        LIMIT $${fIdx} OFFSET $${fIdx + 1}`,
        [...finalParams, limit, offset]
      );

      res.json({ success: true, ...paginatedResponse(rows, total, page, limit) });
    } else {
      const { rows } = await db.query(
        `SELECT e.*,
          CASE WHEN e.is_anonymous THEN 'Anonymous' ELSE u.full_name END as author_name,
          false as is_liked, false as is_bookmarked,
          c.min_cgpa as company_min_cgpa,
          c.package as company_package,
          c.logo_url as company_logo
        FROM experiences e
        LEFT JOIN students s ON e.student_id = s.id
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN companies c ON LOWER(c.name) = LOWER(e.company_name)
        WHERE ${whereClause}
        ORDER BY ${sortColumn} DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      res.json({ success: true, ...paginatedResponse(rows, total, page, limit) });
    }
  } catch (error) {
    console.error('Get experiences error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch experiences.' });
  }
};

// ============================================
// POST /api/experiences
// ============================================
const createExperience = async (req, res) => {
  try {
    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { company_name, role, rounds, questions, difficulty, tips, experience, is_anonymous } = req.body;

    const { rows } = await db.query(
      `INSERT INTO experiences (student_id, company_name, role, rounds, questions, difficulty, tips, experience, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [is_anonymous ? null : studentResult.rows[0].id, company_name, role, rounds, questions,
       difficulty || 'medium', tips, experience, is_anonymous !== false]
    );

    res.status(201).json({
      success: true,
      message: 'Experience shared successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Create experience error:', error);
    res.status(500).json({ success: false, message: 'Failed to share experience.' });
  }
};

// ============================================
// POST /api/experiences/:id/like
// ============================================
const toggleLike = async (req, res) => {
  try {
    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const studentId = studentResult.rows[0].id;
    const experienceId = req.params.id;

    // Check if already liked
    const existing = await db.query(
      'SELECT id FROM likes WHERE student_id = $1 AND experience_id = $2',
      [studentId, experienceId]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await db.query('DELETE FROM likes WHERE student_id = $1 AND experience_id = $2', [studentId, experienceId]);
      res.json({ success: true, message: 'Unliked.', liked: false });
    } else {
      // Like
      await db.query(
        'INSERT INTO likes (student_id, experience_id) VALUES ($1, $2)',
        [studentId, experienceId]
      );
      res.json({ success: true, message: 'Liked.', liked: true });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like.' });
  }
};

// ============================================
// POST /api/experiences/:id/bookmark
// ============================================
const toggleBookmark = async (req, res) => {
  try {
    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const studentId = studentResult.rows[0].id;
    const experienceId = req.params.id;

    const existing = await db.query(
      'SELECT id FROM bookmarks WHERE student_id = $1 AND experience_id = $2',
      [studentId, experienceId]
    );

    if (existing.rows.length > 0) {
      await db.query('DELETE FROM bookmarks WHERE student_id = $1 AND experience_id = $2', [studentId, experienceId]);
      res.json({ success: true, message: 'Unbookmarked.', bookmarked: false });
    } else {
      await db.query(
        'INSERT INTO bookmarks (student_id, experience_id) VALUES ($1, $2)',
        [studentId, experienceId]
      );
      res.json({ success: true, message: 'Bookmarked.', bookmarked: true });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
};

// ============================================
// GET /api/experiences/bookmarks
// ============================================
const getBookmarkedExperiences = async (req, res) => {
  try {
    const studentResult = await db.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { rows } = await db.query(
      `SELECT e.*,
        CASE WHEN e.is_anonymous THEN 'Anonymous' ELSE u.full_name END as author_name,
        true as is_bookmarked,
        CASE WHEN l.id IS NOT NULL THEN true ELSE false END as is_liked
      FROM bookmarks b
      JOIN experiences e ON b.experience_id = e.id
      LEFT JOIN students s ON e.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN likes l ON l.experience_id = e.id AND l.student_id = $1
      WHERE b.student_id = $1
      ORDER BY b.created_at DESC`,
      [studentResult.rows[0].id]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks.' });
  }
};

module.exports = {
  getExperiences,
  createExperience,
  toggleLike,
  toggleBookmark,
  getBookmarkedExperiences,
};
