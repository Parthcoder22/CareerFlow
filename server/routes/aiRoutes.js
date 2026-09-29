// ============================================
// AI Routes
// ============================================
const express = require('express');
const router = express.Router();
const { analyzeResume, analyzeJD } = require('../controllers/aiController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ATS Resume & JD matching analyzer
router.post('/analyze-resume', auth, roleCheck('student', 'admin'), analyzeResume);
router.post('/analyze-jd', auth, roleCheck('student', 'admin'), analyzeJD);

module.exports = router;
