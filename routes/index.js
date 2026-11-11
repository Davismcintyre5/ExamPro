const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const platformSettingsRoutes = require('./platformSettings');
const settingsRoutes = require('./settings');
const uploadRoutes = require('./uploads');
const departmentRoutes = require('./departments');
const courseRoutes = require('./courses');
const classRoutes = require('./classes');
const studentRoutes = require('./students');
const scoreRoutes = require('./scores');
const reportRoutes = require('./reports');

router.use('/auth', authRoutes);
router.use('/platform-settings', platformSettingsRoutes);
router.use('/settings', settingsRoutes);
router.use('/uploads', uploadRoutes);
router.use('/departments', departmentRoutes);
router.use('/courses', courseRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/scores', scoreRoutes);
router.use('/reports', reportRoutes);

module.exports = router;