export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateScore = (score, maxScore = 100) => {
  const numScore = Number(score);
  return !isNaN(numScore) && numScore >= 0 && numScore <= maxScore;
};

export const validateWeights = (weights) => {
  const total = Object.values(weights).reduce((sum, weight) => sum + Number(weight), 0);
  return total === 100;
};

export const validateRequiredFields = (fields, data) => {
  const missingFields = fields.filter(field => !data[field]);
  return missingFields;
};

export const validateAdmissionNumber = (admissionNumber) => {
  const admissionRegex = /^[a-zA-Z0-9-_/]+$/;
  return admissionRegex.test(admissionNumber);
};

export const validateCourseCode = (courseCode) => {
  const codeRegex = /^[a-zA-Z0-9-_/]+$/;
  return codeRegex.test(courseCode);
};