const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const adminAuth = require('../middleware/adminAuth');
const uploadController = require('../controllers/uploadController');

router.post(
  '/image',
  adminAuth,
  upload.single('file'),
  uploadController.uploadImage
);

router.post(
  '/image/:type',
  adminAuth,
  upload.single('file'),
  uploadController.uploadImage
);

router.delete(
  '/image',
  adminAuth,
  uploadController.deleteUploadedImage
);

module.exports = router;