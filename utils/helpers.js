const crypto = require('crypto');

const generateUniqueId = () => {
  return crypto.randomBytes(16).toString('hex');
};

const generateAdminHash = () => {
  return crypto.randomBytes(32).toString('hex');
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

const paginateResults = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

const sortResults = (sortBy = 'createdAt', order = 'desc') => {
  return { [sortBy]: order === 'desc' ? -1 : 1 };
};

const generateUniqueCode = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

const roundToTwo = (num) => {
  return Math.round(num * 100) / 100;
};

const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

const removeDuplicates = (array) => {
  return [...new Set(array)];
};

module.exports = {
  generateUniqueId,
  generateAdminHash,
  formatDate,
  formatDateTime,
  paginateResults,
  sortResults,
  generateUniqueCode,
  roundToTwo,
  isEmptyObject,
  removeDuplicates,
};