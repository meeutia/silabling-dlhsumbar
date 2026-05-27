export function stripHtml(html = '') {
  return String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function normalizeBool(value) {
  return value === true || value === 1 || value === '1';
}

export function formatCurrency(value) {
  const number = Number(value || 0);
  return `Rp ${number.toLocaleString('id-ID')}`;
}

export function getCurrencyDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function formatRupiahInput(value) {
  const digits = getCurrencyDigits(value);
  if (!digits) return '';
  const number = Number(digits);
  if (!Number.isFinite(number)) return '';
  return `Rp ${number.toLocaleString('id-ID')}`;
}

export function toCurrencyNumber(value) {
  const digits = getCurrencyDigits(value);
  return digits ? Number(digits) : 0;
}

