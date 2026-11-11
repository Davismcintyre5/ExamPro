const express = require('express');
const router = express.Router();
const multer = require('multer');
const scoreController = require('../controllers/scoreController');
const adminAuth = require('../middleware/adminAuth');
const ownerOnly = require('../middleware/ownerOnly');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/class/:classId', adminAuth, scoreController.getScoresByClass);
router.get('/unit/:unitId', adminAuth, scoreController.getScoresByUnit);
router.get('/student/:studentId', adminAuth, scoreController.getScoresByStudent);
router.get('/export', adminAuth, scoreController.exportScores);
router.post('/bulk', adminAuth, scoreController.saveBulkScores);
router.post('/paste', adminAuth, scoreController.pasteScores);
router.post('/import', adminAuth, upload.single('file'), scoreController.importScores);
router.post('/unlock', adminAuth, ownerOnly, scoreController.unlockScores);
router.put('/:id', adminAuth, scoreController.updateScore);
router.delete('/:id', adminAuth, scoreController.deleteScore);

module.exports = router;