const { cloudinary, isConfigured, deleteImage, getFolder } = require('../config/cloudinary');

const uploadImage = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(500).json({
        message: 'Cloudinary is not configured. Check environment variables.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;

    res.status(201).json({
      message: 'Upload successful',
      url: file.path || file.secure_url || file.url,
      publicId: file.filename || file.public_id,
      width: file.width,
      height: file.height,
      format: file.format,
      bytes: file.bytes,
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: error.message || 'Upload failed' });
  }
};

const deleteUploadedImage = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(500).json({ message: 'Cloudinary not configured' });
    }

    const publicId = req.body.publicId || req.query.publicId;
    if (!publicId) {
      return res.status(400).json({ message: 'publicId is required' });
    }

    await deleteImage(publicId);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: error.message || 'Delete failed' });
  }
};

const extractPublicId = (url) => {
  if (!url) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};

module.exports = {
  uploadImage,
  deleteUploadedImage,
  extractPublicId,
};