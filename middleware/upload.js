const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary, getFolder } = require('../config/cloudinary');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'svg'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const type = req.body.type || req.query.type || 'misc';
    const tenantId = req.tenantId || req.userId || 'shared';
    const folder = getFolder(type, tenantId);

    const timestamp = Date.now();
    const sanitizedName = (file.originalname || 'image')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .slice(0, 40);

    return {
      folder,
      public_id: `${type}-${timestamp}-${sanitizedName}`,
      allowed_formats: ALLOWED_FORMATS,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
      ],
    };
  },
});

const fileFilter = (req, file, cb) => {
  const mimetype = file.mimetype || '';
  if (
    mimetype.startsWith('image/') &&
    (mimetype.includes('png') ||
      mimetype.includes('jpeg') ||
      mimetype.includes('jpg') ||
      mimetype.includes('webp') ||
      mimetype.includes('svg'))
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, WebP, and SVG images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = upload;