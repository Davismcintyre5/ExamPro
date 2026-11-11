const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

const validateScore = (score, maxScore = 100) => {
  const numScore = Number(score);
  return !isNaN(numScore) && numScore >= 0 && numScore <= maxScore;
};

const validateWeights = (weights) => {
  const total = Object.values(weights).reduce((sum, weight) => sum + Number(weight), 0);
  return total === 100;
};

const validateRequiredFields = (fields, data) => {
  const missingFields = fields.filter(field => !data[field]);
  return missingFields;
};

const validateExamType = (examType) => {
  const validTypes = ['assignment_cat_exam', 'cat_exam', 'exam_only', 'custom'];
  return validTypes.includes(examType);
};

const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
};

const validateAdmissionNumber = (admissionNumber) => {
  const admissionRegex = /^[a-zA-Z0-9-_/]+$/;
  return admissionRegex.test(admissionNumber);
};

module.exports = {
  validateEmail,
  validatePhone,
  validateScore,
  validateWeights,
  validateRequiredFields,
  validateExamType,
  sanitizeString,
  validateAdmissionNumber,
};