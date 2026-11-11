const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const isConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const FOLDER_PREFIX = process.env.CLOUDINARY_FOLDER_PREFIX || 'exampro';

const getFolder = (type, tenantId) => {
  switch (type) {
    case 'logo':
      return tenantId ? `${FOLDER_PREFIX}/${tenantId}/logo` : `${FOLDER_PREFIX}/logos`;
    case 'letterhead':
      return tenantId ? `${FOLDER_PREFIX}/${tenantId}/letterhead` : `${FOLDER_PREFIX}/letterheads`;
    case 'platform-logo':
      return `${FOLDER_PREFIX}/platform/logo`;
    case 'platform-favicon':
      return `${FOLDER_PREFIX}/platform/favicon`;
    default:
      return `${FOLDER_PREFIX}/misc`;
  }
};

const deleteImage = async (publicId) => {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
    throw error;
  }
};

module.exports = {
  cloudinary,
  isConfigured,
  getFolder,
  deleteImage,
  FOLDER_PREFIX,
};