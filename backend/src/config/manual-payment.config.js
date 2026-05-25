const manualPaymentConfig = {
  bankName: process.env.MANUAL_PAYMENT_BANK || 'Bank Nagari',
  bank_name: process.env.MANUAL_PAYMENT_BANK || 'Bank Nagari',
  accountNumber: process.env.MANUAL_PAYMENT_ACCOUNT_NUMBER || '0000000000',
  account_number: process.env.MANUAL_PAYMENT_ACCOUNT_NUMBER || '0000000000',
  accountName: process.env.MANUAL_PAYMENT_ACCOUNT_NAME || 'UPTD Laboratorium Lingkungan DLH Sumbar',
  account_name: process.env.MANUAL_PAYMENT_ACCOUNT_NAME || 'UPTD Laboratorium Lingkungan DLH Sumbar',
  note:
    process.env.MANUAL_PAYMENT_NOTE ||
    'Pastikan nominal transfer sesuai total tagihan, lalu upload bukti pembayaran pada form pelanggan.',
  catatan:
    process.env.MANUAL_PAYMENT_NOTE ||
    'Pastikan nominal transfer sesuai total tagihan, lalu upload bukti pembayaran pada form pelanggan.',
};

module.exports = manualPaymentConfig;
