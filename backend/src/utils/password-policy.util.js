const crypto = require('crypto');

const PASSWORD_POLICY_MESSAGE = 'Password minimal 8 karakter dan harus mengandung huruf serta angka.';

function normalizePassword(password) {
  return String(password || '');
}

function validatePasswordPolicy(password) {
  const value = normalizePassword(password);

  if (!value || value.length < 8) {
    return {
      valid: false,
      message: PASSWORD_POLICY_MESSAGE,
    };
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return {
      valid: false,
      message: PASSWORD_POLICY_MESSAGE,
    };
  }

  return {
    valid: true,
    message: null,
  };
}

function assertPasswordPolicy(password, message = PASSWORD_POLICY_MESSAGE) {
  const result = validatePasswordPolicy(password);

  if (!result.valid) {
    throw new Error(message || result.message || PASSWORD_POLICY_MESSAGE);
  }

  return normalizePassword(password);
}

function generateTemporaryPassword() {
  // Prefix huruf + token acak + angka 2 digit memastikan policy selalu terpenuhi.
  const randomPart = crypto.randomBytes(6).toString('base64url');
  const numericPart = String(crypto.randomInt(10, 100));
  return `Silab${randomPart}${numericPart}`;
}

module.exports = {
  PASSWORD_POLICY_MESSAGE,
  validatePasswordPolicy,
  assertPasswordPolicy,
  generateTemporaryPassword,
};
