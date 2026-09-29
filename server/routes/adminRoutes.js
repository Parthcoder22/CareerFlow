// ============================================
// Admin / TNP Placement Authority Routes
// ============================================
const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentDetails,
  updateStudentPermission,
  getStatistics,
  getCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
  getCompanyApplicants,
  updateApplicationStatus,
  getAllAdminApplications,
} = require('../controllers/adminController');

const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All admin routes require authentication + admin role
router.use(auth, roleCheck('admin'));

// Placement Dashboard & Analytics
router.get('/statistics', getStatistics);

// Student Directory & Placement Permissions
router.get('/students', getStudents);
router.get('/students/:id', getStudentDetails);
router.put('/students/:id/permission', updateStudentPermission);

// Company & Drive Management
router.get('/companies', getCompanies);
router.post('/companies', addCompany);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);
router.get('/companies/:id/applicants', getCompanyApplicants);

// Central Application & Hiring Status Updates
router.get('/applications', getAllAdminApplications);
router.put('/applications/:id/status', updateApplicationStatus);

module.exports = router;
