const crypto = require('crypto');

const AMBIGUOUS = /[0O1lI]/g;

const generateTempPassword = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    password += chars.charAt(randomIndex);
  }

  return password.replace(AMBIGUOUS, (char) => {
    const replacements = { '0': 'K', 'O': 'M', '1': 'R', 'l': 'T', 'I': 'V' };
    return replacements[char] || 'X';
  });
};

const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = {
  generateTempPassword,
  generateSecureToken
};