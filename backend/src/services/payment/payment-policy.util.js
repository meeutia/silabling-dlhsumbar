const RequestStatus = require('../../constants/request-status');

/**
 * PAYMENT METHOD
 * - PUBLIC: dipakai pelanggan untuk upload bukti pembayaran manual.
 * - INTERNAL: dipakai admin untuk mencatat pembayaran di akhir.
 */
const PUBLIC_PAYMENT_METHOD = {
  code: 'MANUAL_TRANSFER',
  label: 'Transfer Manual',
  provider: 'MANUAL',
  channel: 'transfer_manual',
  bank: null,
  accountName: 'UPTD Laboratorium Lingkungan'
};

const INTERNAL_PAYMENT_METHOD = {
  code: 'BAYAR_NANTI_ADMIN',
  label: 'Bayar Nanti',
  provider: 'INTERNAL',
  channel: 'bayar_nanti',
  bank: null,
  accountName: null
};

const normalizeAmount = (value) => Number.parseFloat(value || 0) || 0;

const extractPaymentSequence = (paymentId) => {
  const match = String(paymentId || '').match(/(\d+)$/);
  return match ? Number(match[1]) : null;
};

const comparePaymentRowsDesc = (left, right) => {
  const leftSequence = extractPaymentSequence(left?.id_payment);
  const rightSequence = extractPaymentSequence(right?.id_payment);

  if (leftSequence !== null && rightSequence !== null && leftSequence !== rightSequence) {
    return rightSequence - leftSequence;
  }

  return String(right?.id_payment || '').localeCompare(String(left?.id_payment || ''));
};

const getLatestPaymentRow = (paymentRows = []) => {
  return [...paymentRows].sort(comparePaymentRowsDesc)[0] || null;
};

const PAYMENT_COMPLETED_STATUSES = new Set([
  RequestStatus.WAITING_SAMPLE,
  RequestStatus.TESTING_PROCESS,
  RequestStatus.COMPLETED,
]);

const canMoveRequestToWaitingSampleAfterPayment = (status) => {
  return [
    RequestStatus.WAITING_PAYMENT,
    RequestStatus.WAITING_PAYMENT_VERIFICATION,
    RequestStatus.WAITING_SAMPLE,
  ].includes(status);
};

const isRequestAlreadyPastPayment = (status) => PAYMENT_COMPLETED_STATUSES.has(status);

const isInvoiceSettled = (invoice) => {
  return ['Lunas', 'Bayar Nanti'].includes(String(invoice?.status_invoice || '').trim());
};

const isSettledPayment = (payment) => {
  if (!payment) return false;
  return payment.status_verifikasi === 'Terverifikasi' || Boolean(payment.verified_at);
};

const isDeferredPaymentAttempt = (payment) => {
  if (!payment) return false;
  const methodCode = String(payment.metode_bayar || '').trim().toUpperCase();
  return methodCode === INTERNAL_PAYMENT_METHOD.code || methodCode === 'MANUAL' || methodCode === 'PEMBAYARAN_AKHIR_ADMIN';
};

const getPaymentLifecycleState = (payment) => {
  if (!payment) return { state: 'none' };
  if (isDeferredPaymentAttempt(payment)) return { state: 'deferred' };
  if (isSettledPayment(payment)) return { state: 'settled' };
  if (payment.status_verifikasi === 'Ditolak') return { state: 'rejected' };
  if (payment.bukti_bayar_path) return { state: 'waiting_verification' };
  return { state: 'draft' };
};

const FINAL_REQUEST_REJECTION_STATUSES = new Set([
  RequestStatus.REJECTED,
  RequestStatus.CANCELLED_BY_CUSTOMER,
  RequestStatus.REJECTED_BY_ADMIN,
  RequestStatus.REJECTED_BY_KASI,
  RequestStatus.REJECTED_BY_PENYELIA
]);

const deriveCustomerDecisionStatus = (statusFppl) => {
  if (statusFppl === RequestStatus.CANCELLED_BY_CUSTOMER) return RequestStatus.CANCELLED_BY_CUSTOMER;
  if (statusFppl === RequestStatus.REJECTED_BY_ADMIN) return RequestStatus.REJECTED_BY_ADMIN;
  if (statusFppl === RequestStatus.REJECTED_BY_KASI) return RequestStatus.REJECTED_BY_KASI;
  if (statusFppl === RequestStatus.REJECTED_BY_PENYELIA) return RequestStatus.REJECTED_BY_PENYELIA;
  if (statusFppl === RequestStatus.REJECTED) return 'Dibatalkan';

  if ([RequestStatus.WAITING_PAYMENT, RequestStatus.WAITING_PAYMENT_VERIFICATION].includes(statusFppl)) {
    return 'Menunggu Pembayaran';
  }

  if ([RequestStatus.WAITING_SAMPLE, RequestStatus.TESTING_PROCESS, RequestStatus.COMPLETED].includes(statusFppl)) {
    return 'Disetujui';
  }

  return 'Menunggu';
};

const getAvailablePaymentMethods = () => [{ ...PUBLIC_PAYMENT_METHOD }];

const resolvePaymentMethod = (identifier) => {
  if (!identifier) return null;

  const normalized = String(identifier).trim().toUpperCase();

  if (
    normalized === PUBLIC_PAYMENT_METHOD.code ||
    normalized === PUBLIC_PAYMENT_METHOD.label.toUpperCase() ||
    normalized === 'TRANSFER' ||
    normalized === 'TRANSFER_MANUAL' ||
    normalized === 'MANUAL_TRANSFER' ||
    normalized === 'VA_BCA' ||
    normalized === 'XENDIT_QRIS' ||
    normalized === 'XENDIT_DANA'
  ) {
    return PUBLIC_PAYMENT_METHOD;
  }

  if (
    normalized === INTERNAL_PAYMENT_METHOD.code ||
    normalized === INTERNAL_PAYMENT_METHOD.label.toUpperCase() ||
    normalized === 'MANUAL' ||
    normalized === 'PEMBAYARAN_AKHIR_ADMIN'
  ) {
    return INTERNAL_PAYMENT_METHOD;
  }

  return null;
};

const normalizeGatewayStatus = () => null;

module.exports = {
  ACTIVE_GATEWAY_STATUSES: new Set(),
  DANA_PAYMENT_METHOD: PUBLIC_PAYMENT_METHOD,
  INTERNAL_PAYMENT_METHOD,
  PUBLIC_PAYMENT_METHOD,
  QRIS_PAYMENT_METHOD: PUBLIC_PAYMENT_METHOD,
  TERMINAL_GATEWAY_STATUSES: new Set(),
  canMoveRequestToWaitingSampleAfterPayment,
  comparePaymentRowsDesc,
  deriveCustomerDecisionStatus,
  getAvailablePaymentMethods,
  getLatestPaymentRow,
  getPaymentLifecycleState,
  isDeferredPaymentAttempt,
  isInvoiceSettled,
  isRequestAlreadyPastPayment,
  isSettledPayment,
  normalizeAmount,
  normalizeGatewayStatus,
  resolvePaymentMethod,
};
