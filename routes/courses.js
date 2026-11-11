const express = require('express');
const router = express.Router();
const multer = require('multer');
const courseController = require('../controllers/courseController');
const adminAuth = require('../middleware/adminAuth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', adminAuth, courseController.getCourses);
router.get('/export', adminAuth, courseController.exportCourses);
router.get('/:id', adminAuth, courseController.getCourseById);
router.post('/', adminAuth, courseController.createCourse);
router.post('/bulk', adminAuth, courseController.addBulkCourses);
router.post('/import', adminAuth, upload.single('file'), courseController.importCourses);
router.put('/:id', adminAuth, courseController.updateCourse);
router.delete('/:id', adminAuth, courseController.deleteCourse);

module.exports = router;