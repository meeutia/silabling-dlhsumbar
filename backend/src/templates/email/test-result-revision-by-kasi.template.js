const { buildEmailResponse } = require('./email-layout.template');

function buildTestResultRevisionByKasiEmail({
  analis,
  noSampel,
  catatanRevisi,
  items = [],
  testingLink = null,
}) {
  const namaAnalis = analis?.username || analis?.nama_pegawai || analis?.nik || 'Analis';

  const subject = `Revisi Hasil Pengujian dari Kasi Pengujian - ${noSampel}`;

  const daftarParameter = items.length
    ? items
        .map((item, index) => {
          const parameter = item.nama_parameter || item.namaParameter || '-';
          const metode = item.acuan_metode || item.acuanMetode || item.nama_metode || item.namaMetode || '-';
          return `${index + 1}. ${parameter}\n   Metode: ${metode}`;
        })
        .join('\n')
    : '-';

  const body = [
    `Yth. ${namaAnalis},`,
    '',
    `Kasi Pengujian meminta revisi hasil pengujian untuk sampel ${noSampel}.`,
    '',
    'Parameter/metode yang perlu direvisi:',
    daftarParameter,
    '',
    'Catatan revisi:',
    catatanRevisi || '-',
    '',
    `Link ke halaman pengujian: ${testingLink || '-'}`,
    '',
    'Mohon segera melakukan perbaikan hasil pengujian/LKA pada sistem.',
    '',
    'Terima kasih.',
  ].join('\n');

  return buildEmailResponse({
    subject,
    body,
    title: subject,
    preheader: `Revisi hasil pengujian untuk sampel ${noSampel}.`,
    actionUrl: testingLink,
    actionLabel: 'Buka Tugas Pengujian',
  });
}

module.exports = {
  buildTestResultRevisionByKasiEmail,
};
