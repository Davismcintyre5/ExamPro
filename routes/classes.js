const express = require('express');
const router = express.Router();
const multer = require('multer');
const classController = require('../controllers/classController');
const adminAuth = require('../middleware/adminAuth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', adminAuth, classController.getClasses);
router.get('/export', adminAuth, classController.exportClasses);
router.get('/:id', adminAuth, classController.getClassById);
router.post('/', adminAuth, classController.createClass);
router.post('/bulk', adminAuth, classController.addBulkClasses);
router.post('/import', adminAuth, upload.single('file'), classController.importClasses);
router.put('/:id', adminAuth, classController.updateClass);
router.delete('/:id', adminAuth, classController.deleteClass);

router.post('/:id/units', adminAuth, classController.addUnit);
router.post('/:id/units/bulk', adminAuth, classController.addBulkUnits);
router.post('/:id/units/import', adminAuth, upload.single('file'), classController.importUnits);
router.get('/:id/units/export', adminAuth, classController.exportUnits);
router.put('/:id/units/:unitId', adminAuth, classController.updateUnit);
router.delete('/:id/units/:unitId', adminAuth, classController.deleteUnit);

module.exports = router;