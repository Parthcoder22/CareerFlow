// ============================================
// Admin Routes
// ============================================
const express = require('express');
const router = express.Router();
const { getStudents, getStatistics, addCompany, deleteCompany, getCompanies } = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All admin routes require authentication + admin role
router.use(auth, roleCheck('admin'));

router.get('/students', getStudents);
router.get('/statistics', getStatistics);
router.get('/companies', getCompanies);
router.post('/companies', addCompany);
router.delete('/companies/:id', deleteCompany);

module.exports = router;
