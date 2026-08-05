// ============================================
// Application Routes
// ============================================
const express = require('express');
const router = express.Router();
const { getApplications, getApplication, createApplication, updateApplication, deleteApplication } = require('../controllers/applicationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validate, applicationRules } = require('../middleware/validate');

router.get('/', auth, roleCheck('student', 'admin'), getApplications);
router.get('/:id', auth, roleCheck('student', 'admin'), getApplication);
router.post('/', auth, roleCheck('student', 'admin'), applicationRules, validate, createApplication);
router.put('/:id', auth, roleCheck('student', 'admin'), updateApplication);
router.delete('/:id', auth, roleCheck('student', 'admin'), deleteApplication);

module.exports = router;
