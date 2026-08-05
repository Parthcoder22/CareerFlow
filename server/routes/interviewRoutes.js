// ============================================
// Interview Routes
// ============================================
const express = require('express');
const router = express.Router();
const { getInterviewNotes, createInterviewNote, updateInterviewNote, deleteInterviewNote } = require('../controllers/interviewController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validate, interviewNoteRules } = require('../middleware/validate');

router.get('/', auth, roleCheck('student', 'admin'), getInterviewNotes);
router.post('/', auth, roleCheck('student', 'admin'), interviewNoteRules, validate, createInterviewNote);
router.put('/:id', auth, roleCheck('student', 'admin'), updateInterviewNote);
router.delete('/:id', auth, roleCheck('student', 'admin'), deleteInterviewNote);

module.exports = router;
