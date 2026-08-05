// ============================================
// Resume Controller
// ============================================
// Handles resume upload (to Cloudinary), listing, and deletion.
// Flow: Client → Multer (memory) → Cloudinary → URL stored in PostgreSQL

const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const cloudinary = require('../config/cloudinary');

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
// GET /api/resumes
// ============================================
const getResumes = async (req, res) => {
  try {
    const studentId = await getOrCreateStudentId(req.user.id);

    const { rows } = await db.query(
      'SELECT * FROM resumes WHERE student_id = $1 ORDER BY created_at DESC',
      [studentId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch resumes.' });
  }
};

// ============================================
// POST /api/resumes
// ============================================
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const studentId = await getOrCreateStudentId(req.user.id);
    const { name, target_company } = req.body;

    // Save locally for guaranteed 100% reliable PDF viewing
    const uploadsDir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `resume_${studentId}_${Date.now()}.pdf`;
    const localPath = path.join(uploadsDir, filename);
    fs.writeFileSync(localPath, req.file.buffer);

    const relativeUrl = `/uploads/resumes/${filename}`;

    // Optional Cloudinary upload in background
    let cloudinaryId = null;
    try {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const cloudRes = await cloudinary.uploader.upload(dataURI, {
        folder: 'careerflow/resumes',
        resource_type: 'raw',
        public_id: filename.replace('.pdf', ''),
      });
      cloudinaryId = cloudRes.public_id;
    } catch (cloudErr) {
      console.warn('Cloudinary upload warning:', cloudErr.message);
    }

    // Calculate version number
    const versionResult = await db.query(
      'SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM resumes WHERE student_id = $1',
      [studentId]
    );

    const { rows } = await db.query(
      `INSERT INTO resumes (student_id, name, target_company, file_url, cloudinary_id, version, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        studentId,
        name || req.file.originalname,
        target_company || null,
        relativeUrl,
        cloudinaryId,
        versionResult.rows[0].next_version,
        req.file.size,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload resume.' });
  }
};

// ============================================
// DELETE /api/resumes/:id
// ============================================
const deleteResume = async (req, res) => {
  try {
    const studentId = await getOrCreateStudentId(req.user.id);

    const resumeResult = await db.query(
      'SELECT * FROM resumes WHERE id = $1 AND student_id = $2',
      [req.params.id, studentId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const resume = resumeResult.rows[0];

    // Delete local file if present
    if (resume.file_url && resume.file_url.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '..', resume.file_url);
      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch (e) { /* silent */ }
      }
    }

    // Delete from Cloudinary if present
    if (resume.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(resume.cloudinary_id, { resource_type: 'raw' });
      } catch (cloudErr) {
        console.warn('Cloudinary delete warning:', cloudErr.message);
      }
    }

    await db.query(
      'DELETE FROM resumes WHERE id = $1 AND student_id = $2',
      [req.params.id, studentId]
    );

    res.json({ success: true, message: 'Resume deleted successfully.' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete resume.' });
  }
};

// ============================================
// GET /api/resumes/:id/file
// ============================================
const viewResumeFile = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT file_url, name FROM resumes WHERE id = $1',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Resume file not found.');
    }

    const resume = rows[0];
    const safeName = (resume.name || 'resume').replace(/[^a-zA-Z0-9_\-]/g, '_');

    // Case 1: Local PDF File
    if (resume.file_url && resume.file_url.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '..', resume.file_url);
      if (fs.existsSync(localPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeName}.pdf"`);
        return res.sendFile(localPath);
      }
    }

    // Case 2: Remote / External URL
    const fetchResponse = await fetch(resume.file_url);
    if (fetchResponse.ok) {
      const arrayBuffer = await fetchResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safeName}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    }

    res.status(404).send('Resume PDF is currently unavailable.');
  } catch (error) {
    console.error('View resume error:', error);
    res.status(500).send('Failed to stream resume PDF.');
  }
};

module.exports = { getResumes, uploadResume, deleteResume, viewResumeFile };
