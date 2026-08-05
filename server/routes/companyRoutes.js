// ============================================
// Public / Student Company Routes
// ============================================
const express = require('express');
const router = express.Router();
const { getPublicCompanies } = require('../controllers/companyController');
const auth = require('../middleware/auth');

router.get('/', auth, getPublicCompanies);

module.exports = router;
