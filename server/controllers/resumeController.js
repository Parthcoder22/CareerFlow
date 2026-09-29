// ============================================
// Resume Controller - Cloudinary Single Source of Truth
// ============================================
// Handles resume upload directly to Cloudinary, listing, deletion, and preview.
// Flow: Client → Multer (memory) → Cloudinary (secure_url) → PostgreSQL metadata
// NO local PDF file storage or local filesystem dependencies.

const db = require('../config/db');
const { uploadResumeToCloudinary, deleteResumeFromCloudinary } = require('../services/cloudinaryService');

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
      `SELECT id, student_id, name, target_company, file_url, 
              COALESCE(cloudinary_public_id, cloudinary_id) as cloudinary_public_id,
              version, file_size, created_at, updated_at
       FROM resumes 
       WHERE student_id = $1 
       ORDER BY created_at DESC`,
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
  let uploadedCloudinaryId = null;
  let uploadedResourceType = 'auto';

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const studentId = await getOrCreateStudentId(req.user.id);
    const { name, target_company } = req.body;

    // 1. Upload buffer directly to Cloudinary (Folder: careerflow/resumes/student_${studentId}/)
    let cloudRes;
    try {
      cloudRes = await uploadResumeToCloudinary(
        req.file.buffer,
        studentId,
        req.file.originalname
      );
      uploadedCloudinaryId = cloudRes.public_id;
      uploadedResourceType = cloudRes.resource_type;
    } catch (cloudErr) {
      console.error('Cloudinary resume upload failed:', cloudErr);
      return res.status(502).json({
        success: false,
        message: 'Failed to upload resume to Cloudinary storage. Please check Cloudinary configuration or try again.',
      });
    }

    // 2. Calculate next resume version for this student
    const versionResult = await db.query(
      'SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM resumes WHERE student_id = $1',
      [studentId]
    );
    const nextVersion = versionResult.rows[0].next_version;

    // 3. Store metadata in PostgreSQL
    let rows;
    try {
      const insertResult = await db.query(
        `INSERT INTO resumes (
           student_id, name, target_company, file_url, 
           cloudinary_id, cloudinary_public_id, version, file_size
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          studentId,
          name || req.file.originalname.replace(/\.pdf$/i, ''),
          target_company || null,
          cloudRes.secure_url,
          cloudRes.public_id,
          cloudRes.public_id,
          nextVersion,
          cloudRes.bytes || req.file.size,
        ]
      );
      rows = insertResult.rows;
    } catch (dbErr) {
      // Rollback newly uploaded Cloudinary asset if DB insertion fails (prevent orphan files)
      if (uploadedCloudinaryId) {
        console.warn(`Database insert failed after Cloudinary upload. Cleaning up asset ${uploadedCloudinaryId}...`);
        await deleteResumeFromCloudinary(uploadedCloudinaryId, uploadedResourceType);
      }
      throw dbErr;
    }

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully to Cloudinary.',
      data: rows[0],
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ success: false, message: 'Failed to save resume metadata.' });
  }
};

// ============================================
// DELETE /api/resumes/:id
// ============================================
const deleteResume = async (req, res) => {
  try {
    const studentId = await getOrCreateStudentId(req.user.id);

    // 1. Verify ownership
    const resumeResult = await db.query(
      'SELECT * FROM resumes WHERE id = $1 AND student_id = $2',
      [req.params.id, studentId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resume not found or access denied.' });
    }

    const resume = resumeResult.rows[0];
    const publicId = resume.cloudinary_public_id || resume.cloudinary_id;

    // 2. Delete asset from Cloudinary (No fs.unlinkSync)
    if (publicId) {
      await deleteResumeFromCloudinary(publicId, 'raw');
    }

    // 3. Delete database record
    await db.query(
      'DELETE FROM resumes WHERE id = $1 AND student_id = $2',
      [req.params.id, studentId]
    );

    res.json({ success: true, message: 'Resume deleted successfully from Cloudinary and database.' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete resume.' });
  }
};

// ============================================
// GET /api/resumes/:id/file
// ============================================
// Redirects directly to the Cloudinary secure_url
const viewResumeFile = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT file_url, name FROM resumes WHERE id = $1',
      [req.params.id]
    );

    if (rows.length === 0 || !rows[0].file_url) {
      return res.status(404).send('Resume file not found.');
    }

    const resume = rows[0];

    // If Cloudinary / absolute URL, redirect directly
    if (resume.file_url.startsWith('http://') || resume.file_url.startsWith('https://')) {
      return res.redirect(resume.file_url);
    }

    // Fallback for legacy local records before migration
    res.redirect(resume.file_url);
  } catch (error) {
    console.error('View resume error:', error);
    res.status(500).send('Failed to locate resume PDF.');
  }
};

module.exports = {
  getResumes,
  uploadResume,
  deleteResume,
  viewResumeFile,
};
