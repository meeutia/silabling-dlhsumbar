export const PASSWORD_POLICY_MESSAGE = 'Password minimal 8 karakter dan harus mengandung huruf serta angka.';

export function validatePasswordPolicy(password) {
  const value = String(password || '');

  if (!value || value.length < 8) {
    return PASSWORD_POLICY_MESSAGE;
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return PASSWORD_POLICY_MESSAGE;
  }

  return '';
}
