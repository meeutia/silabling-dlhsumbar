const { buildEmailResponse } = require('./email-layout.template');

function resolveName(user, fallback) {
  return user?.nama_pegawai || user?.username || user?.nik || fallback;
}

function formatParameterItems(items = []) {
  if (!Array.isArray(items) || !items.length) return '-';

  return items
    .map((item, index) => {
      const parameter = item.nama_parameter || item.namaParameter || '-';
      const metode = item.acuan_metode || item.acuanMetode || item.nama_metode || item.namaMetode || '-';
      const catatan = item.catatan_revisi || item.catatanRevisi || item.catatan || '-';

      return `${index + 1}. ${parameter}\n   Metode: ${metode}\n   Catatan: ${catatan}`;
    })
    .join('\n');
}

function buildKasiRevisionApprovalNeededEmail({
  penyelia,
  noSampel,
  catatanRevisi,
  items = [],
  reviewLink = null,
}) {
  const namaPenyelia = resolveName(penyelia, 'Penyelia');
  const sampleNo = noSampel || '-';
  const subject = `Persetujuan Revisi Kasi Pengujian - ${sampleNo}`;

  const body = [
    `Yth. ${namaPenyelia},`,
    '',
    `Kasi Pengujian mengajukan revisi hasil pengujian untuk sampel ${sampleNo}.`,
    '',
    'Parameter/metode yang diajukan revisi:',
    formatParameterItems(items),
    '',
    'Ringkasan catatan revisi:',
    catatanRevisi || '-',
    '',
    reviewLink ? `Link review Penyelia: ${reviewLink}` : null,
    '',
    'Silakan setujui atau tolak pengajuan revisi tersebut melalui sistem.',
    '',
    'Catatan: Revisi belum masuk ke Analis sebelum disetujui oleh Penyelia.',
    '',
    'Terima kasih.',
  ].filter((line) => line !== null).join('\n');

  return buildEmailResponse({
    subject,
    body,
    title: subject,
    preheader: `Revisi Kasi untuk sampel ${sampleNo} menunggu persetujuan Penyelia.`,
    actionUrl: reviewLink,
    actionLabel: 'Review Revisi Kasi',
  });
}

module.exports = {
  buildKasiRevisionApprovalNeededEmail,
};
