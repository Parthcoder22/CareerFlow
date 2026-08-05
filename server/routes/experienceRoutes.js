// ============================================
// Experience Portal Routes
// ============================================
const express = require('express');
const router = express.Router();
const { getExperiences, createExperience, toggleLike, toggleBookmark, getBookmarkedExperiences } = require('../controllers/experienceController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validate, experienceRules } = require('../middleware/validate');

router.get('/', auth, getExperiences);
router.get('/bookmarks', auth, roleCheck('student', 'admin'), getBookmarkedExperiences);
router.post('/', auth, roleCheck('student', 'admin'), experienceRules, validate, createExperience);
router.post('/:id/like', auth, roleCheck('student', 'admin'), toggleLike);
router.post('/:id/bookmark', auth, roleCheck('student', 'admin'), toggleBookmark);

module.exports = router;
