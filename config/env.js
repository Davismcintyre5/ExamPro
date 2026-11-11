require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/exam_entry_system',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MASTER_ADMIN_HASH: process.env.MASTER_ADMIN_HASH || 'default-admin-hash-2024',
};

module.exports = env;