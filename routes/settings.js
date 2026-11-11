const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const adminAuth = require('../middleware/adminAuth');

router.get('/', adminAuth, settingsController.getSettings);
router.put('/', adminAuth, settingsController.updateSettings);
router.put('/grading-system', adminAuth, settingsController.updateGradingSystem);
router.put('/grades', adminAuth, settingsController.updateGrades);
router.post('/grades', adminAuth, settingsController.addGrade);
router.delete('/grades/:gradeId', adminAuth, settingsController.deleteGrade);

module.exports = router;