// ============================================
// Multer File Upload Middleware
// ============================================
// Design Decision: Multer handles multipart/form-data (file uploads).
// Files are temporarily stored in memory, then uploaded to Cloudinary.
// We don't save files to disk because:
// 1. Serverless platforms (Render) have ephemeral filesystems
// 2. Memory storage is faster for small files like resumes
// 3. Files go directly from memory → Cloudinary

const multer = require('multer');

// Store files in memory as Buffer objects
const storage = multer.memoryStorage();

// File filter: Only allow PDF files for resumes
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for resume uploads'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB max file size
    files: 1,                     // 1 file at a time
  },
});

module.exports = upload;
