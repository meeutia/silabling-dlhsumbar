const REQUEST_STATUS = Object.freeze({
  DRAFT: 'Draft',
  WAITING_VERIFICATION: 'Menunggu Verifikasi',
  WAITING_PARAMETER: 'Menunggu Penentuan Metode',
  WAITING_PAYMENT: 'Menunggu Pembayaran',

  // Legacy non-aktif: alur unggah lampiran pembayaran sudah dihapus.
  // Nilai ini hanya dibaca untuk migrasi/kompatibilitas data lama.
  WAITING_PAYMENT_VERIFICATION: 'Menunggu Verifikasi Pembayaran',

  WAITING_SAMPLE: 'Menunggu Sampel',
  TESTING_PROCESS: 'Proses Pengujian',
  COMPLETED: 'Selesai',
  REJECTED: 'Dibatalkan',
  CANCELLED_BY_CUSTOMER: 'Dibatalkan Pelanggan',
  REJECTED_BY_ADMIN: 'Ditolak Admin',
  REJECTED_BY_KASI: 'Ditolak Kasi',
  REJECTED_BY_PENYELIA: 'Ditolak Penyelia',
});

const REQUEST_STATUS_ALIASES = Object.freeze({
  [REQUEST_STATUS.WAITING_PAYMENT_VERIFICATION]: REQUEST_STATUS.WAITING_PAYMENT,
  'Menunggu Validasi': REQUEST_STATUS.WAITING_VERIFICATION,
  'Menunggu Verifikasi Admin': REQUEST_STATUS.WAITING_VERIFICATION,
  'Menunggu Pengambilan Sampel': REQUEST_STATUS.WAITING_SAMPLE,
  'Menunggu Penerimaan Sampel': REQUEST_STATUS.WAITING_SAMPLE,
  'Pengujian Laboratorium': REQUEST_STATUS.TESTING_PROCESS,
  'Selesai (LHU Disahkan)': REQUEST_STATUS.COMPLETED,
  'LHU Disahkan': REQUEST_STATUS.COMPLETED,
  'Selesai Diambil': REQUEST_STATUS.COMPLETED,
  'Dibatalkan oleh Pelanggan': REQUEST_STATUS.CANCELLED_BY_CUSTOMER,
});

function normalizeRequestStatus(status) {
  const raw = String(status || '').trim();
  return REQUEST_STATUS_ALIASES[raw] || raw;
}

module.exports = {
  ...REQUEST_STATUS,
  REQUEST_STATUS,
  REQUEST_STATUS_ALIASES,
  normalizeRequestStatus,
};
