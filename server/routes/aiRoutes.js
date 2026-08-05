// ============================================
// AI Routes
// ============================================
const express = require('express');
const router = express.Router();
const { analyzeJD } = require('../controllers/aiController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validate, jdAnalyzeRules } = require('../middleware/validate');

router.post('/analyze-jd', auth, roleCheck('student', 'admin'), aiLimiter, jdAnalyzeRules, validate, analyzeJD);

module.exports = router;
