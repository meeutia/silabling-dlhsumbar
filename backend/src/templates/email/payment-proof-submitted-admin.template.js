const { buildEmailResponse } = require('./email-layout.template');

function safeString(value, fallback = '-') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function formatRupiah(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 'Rp 0';
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatTanggalWib(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '-');

  return `${date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })} • ${date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })} WIB`;
}

function displayAdminName(user = {}) {
  return user?.nama_pegawai || user?.username || user?.nik || 'Admin';
}

function buildPaymentProofSubmittedAdminEmail({
  penerima = {},
  fppl = {},
  pelanggan = {},
  invoice = {},
  payment = {},
  detailLink = null,
} = {}) {
  const idRegistrasi = safeString(fppl.id_registrasi || fppl.idRegistrasi || '-');
  const nomorInvoice = safeString(invoice.id_invoice || invoice.nomorInvoice || invoice.nomor_invoice || '-');
  const namaInstansi = safeString(pelanggan.nama_instansi || pelanggan.namaInstansi || '-');
  const pic = safeString(pelanggan.pic || pelanggan.nama_pic || '-');
  const totalTagihan = Number(invoice.subtotal_uji || 0) + Number(invoice.subtotal_pengambilan || 0);
  const jumlahBayar = Number(payment.jumlah_bayar || payment.jumlahBayar || totalTagihan || 0);
  const tanggalUpload = formatTanggalWib(payment.paid_at || payment.paidAt || new Date());
  const namaPenerima = displayAdminName(penerima);

  const subject = `Bukti Pembayaran Menunggu Verifikasi - ${idRegistrasi}`;

  const body = [
    `Yth. ${namaPenerima},`,
    '',
    'Pelanggan telah mengupload bukti pembayaran manual. Pembayaran perlu diverifikasi oleh admin sebelum permohonan dilanjutkan ke tahap sampel.',
    '',
    `No. registrasi: ${idRegistrasi}`,
    `No. invoice: ${nomorInvoice}`,
    `Instansi/Perusahaan: ${namaInstansi}`,
    `PIC: ${pic}`,
    `Jumlah bayar: ${formatRupiah(jumlahBayar)}`,
    `Tanggal upload bukti: ${tanggalUpload}`,
    `Status verifikasi: ${safeString(payment.status_verifikasi || payment.statusVerifikasi || 'Menunggu Verifikasi')}`,
    '',
    'Silakan buka detail permohonan admin, periksa bukti pembayaran, lalu pilih Setujui Pembayaran atau Tolak Pembayaran.',
    '',
    'Terima kasih.',
  ].join('\n');

  return buildEmailResponse({
    subject,
    body,
    title: subject,
    preheader: `Bukti pembayaran ${idRegistrasi} menunggu verifikasi admin.`,
    actionUrl: detailLink,
    actionLabel: 'Buka Verifikasi Pembayaran',
  });
}

module.exports = {
  buildPaymentProofSubmittedAdminEmail,
};
