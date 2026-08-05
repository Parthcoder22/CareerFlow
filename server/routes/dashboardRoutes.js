// ============================================
// Dashboard Routes
// ============================================
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', auth, roleCheck('student'), getDashboardStats);

module.exports = router;
