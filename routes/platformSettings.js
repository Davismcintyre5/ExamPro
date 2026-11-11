const express = require('express');
const router = express.Router();
const platformSettingsController = require('../controllers/platformSettingsController');
const adminAuth = require('../middleware/adminAuth');
const platformAdmin = require('../middleware/platformAdmin');

router.get('/public', platformSettingsController.getPublicSettings);
router.get('/', adminAuth, platformSettingsController.getSettings);
router.put('/', adminAuth, platformAdmin, platformSettingsController.updateSettings);
router.get('/dashboard-stats', adminAuth, platformAdmin, platformSettingsController.getPlatformDashboard);

module.exports = router;