const express = require('express');
const router = express.Router();
const multer = require('multer');
const studentController = require('../controllers/studentController');
const adminAuth = require('../middleware/adminAuth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', adminAuth, studentController.getStudents);
router.get('/export', adminAuth, studentController.exportStudents);
router.get('/class/:classId', adminAuth, studentController.getStudentsByClass);
router.get('/:id', adminAuth, studentController.getStudentById);

router.post('/', adminAuth, studentController.createStudent);
router.post('/bulk', adminAuth, studentController.createBulkStudents);
router.post('/bulk-add', adminAuth, studentController.addBulkStudents);
router.post('/import', adminAuth, upload.single('file'), studentController.importStudents);

router.put('/:id', adminAuth, studentController.updateStudent);
router.delete('/:id', adminAuth, studentController.deleteStudent);

module.exports = router;