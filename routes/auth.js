const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { adminLimiter } = require('../middleware/rateLimiter');
const adminAuth = require('../middleware/adminAuth');
const ownerOnly = require('../middleware/ownerOnly');
const auth = require('../middleware/auth');

router.post('/hidden-admin-register', adminLimiter, authController.hiddenAdminRegister);
router.post('/hidden-admin-login', adminLimiter, authController.hiddenAdminLogin);
router.post('/verify-admin-hash', adminLimiter, authController.verifyAdminHash);
router.get('/admin-info', adminAuth, authController.getAdminInfo);

router.post('/teacher-login', authController.loginTeacher);
router.post('/self-register', adminLimiter, authController.selfRegister);
router.post('/forgot-password', adminLimiter, authController.forgotPassword);
router.post('/reset-password', adminLimiter, authController.resetPassword);
router.put('/change-password', auth, authController.changeOwnPassword);

router.get('/pending-users', adminAuth, authController.getPendingUsers);
router.post('/pending-users/:id/approve', adminAuth, authController.approveUser);
router.post('/pending-users/:id/reject', adminAuth, authController.rejectUser);

router.get('/admins', adminAuth, authController.getAllAdmins);
router.post('/create-admin', adminAuth, authController.createAdminUser);
router.put('/admins/:id', adminAuth, authController.updateAdminUser);
router.put('/admins/:id/toggle', adminAuth, authController.toggleAdminStatus);
router.put('/admins/:id/reset-password', adminAuth, authController.resetAdminPassword);
router.put('/admins/:id/reset-attempts', adminAuth, authController.resetAdminAttempts);
router.delete('/admins/:id', adminAuth, authController.deleteAdminUser);

router.get('/staff', adminAuth, ownerOnly, authController.getStaff);
router.post('/staff', adminAuth, ownerOnly, authController.createStaff);
router.put('/staff/:id', adminAuth, ownerOnly, authController.updateStaff);
router.put('/staff/:id/toggle', adminAuth, ownerOnly, authController.toggleStaffStatus);
router.put('/staff/:id/reset-password', adminAuth, ownerOnly, authController.resetStaffPassword);
router.delete('/staff/:id', adminAuth, ownerOnly, authController.deleteStaff);

module.exports = router;