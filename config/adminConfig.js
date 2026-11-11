require('dotenv').config();

const adminConfig = {
  MASTER_ADMIN_HASH: process.env.MASTER_ADMIN_HASH || 'default-admin-hash-2024',

  ADMIN_SHORTCUT: {
    ctrlKey: true,
    shiftKey: true,
    key: 'A'
  },

  ADMIN_SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000,

  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000,

  ADMIN_JWT_EXPIRY: '7d',
  TEACHER_JWT_EXPIRY: '7d',
  TEMP_JWT_EXPIRY: '5m'
};

module.exports = adminConfig;