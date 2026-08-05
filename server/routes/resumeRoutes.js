// ============================================
// Resume Routes
// ============================================
const express = require('express');
const router = express.Router();
const { getResumes, uploadResume, deleteResume, viewResumeFile } = require('../controllers/resumeController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

router.get('/', auth, roleCheck('student', 'admin'), getResumes);
router.get('/:id/file', auth, roleCheck('student', 'admin'), viewResumeFile);
router.post('/', auth, roleCheck('student', 'admin'), upload.single('resume'), uploadResume);
router.delete('/:id', auth, roleCheck('student', 'admin'), deleteResume);

module.exports = router;
