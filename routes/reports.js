const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const adminAuth = require('../middleware/adminAuth');

router.get('/class/:classId', adminAuth, reportController.getClassReport);
router.get('/class/:classId/export', adminAuth, reportController.exportClassReport);
router.get('/student/:studentId', adminAuth, reportController.getStudentReport);
router.get('/missing/:classId', adminAuth, reportController.getMissingMarks);
router.get('/missing/:classId/export', adminAuth, reportController.exportMissingReport);

module.exports = router;