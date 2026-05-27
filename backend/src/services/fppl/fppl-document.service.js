const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');

const {
  Fppl,
  Pelanggan,
  FpplSampel,
  FpplParameterMetode,
  JenisSampel,
  RegBm,
  Parameter,
  ParameterMetode,
  Metode,
  JadwalSampel,
  Invoice,
  Pegawai,
} = require('../../models/Associations');
const WorkflowLogService = require('../workflow/workflow-log.service');

const PUBLIC_DIR = path.join(__dirname, '../../../public');
const FPPL_DIR = path.join(PUBLIC_DIR, 'fppl');
const LOGO_PATH = path.join(PUBLIC_DIR, 'assets/logos/logo-sumbar.jpg');
const FONT_REGULAR_PATH = path.join(__dirname, '../../assets/fonts/CenturyGothic.ttf');
const FONT_BOLD_PATH = path.join(__dirname, '../../assets/fonts/CenturyGothic-Bold.ttf');

const FINAL_SAMPLE_SCHEDULE_STATUSES = ['Terjadwal', 'Disetujui Pelanggan', 'Disetujui Admin', 'Selesai'];
const CLEARED_INVOICE_STATUSES = ['Lunas', 'Bayar Nanti'];
const FPPL_SIGNER_JABATAN = {
  KASUBAG_TU: 'Kepala Sub Bagian Tata Usaha',
  PENGELOLA_SAMPEL: 'Pengelola Sampel Pengujian',
};
const FPPL_SIGNER_JABATAN_VALUES = Object.values(FPPL_SIGNER_JABATAN);

const PAGE = {
  width: 595.28,
  height: 841.89,
  left: 34,
  right: 34,
  top: 22,
  bottom: 42,
};

// Satu frame utama agar garis kop, box identitas, dan tabel parameter sejajar.
// Nilai ini mengikuti garis horizontal kop surat di template FPPL.
const CONTENT_FRAME = {
  x: 38,
  width: 519,
};
CONTENT_FRAME.right = CONTENT_FRAME.x + CONTENT_FRAME.width;

const FONT = {
  regular: 'CenturyGothic',
  bold: 'CenturyGothic-Bold',
  fallbackRegular: 'Helvetica',
  fallbackBold: 'Helvetica-Bold',
};

function ensureFpplDir() {
  if (!fs.existsSync(FPPL_DIR)) {
    fs.mkdirSync(FPPL_DIR, { recursive: true });
  }
}

function valueOrDash(value) {
  if (value === null || value === undefined || String(value).trim() === '') return '-';
  return String(value);
}

function safeFilename(value = '') {
  return String(value || 'fppl')
    .replace(/[\\/:"*?<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || 'fppl';
}

function formatDateId(value = new Date()) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTimeId(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  const [hour = '', minute = ''] = text.split(':');
  if (!hour || !minute) return text;
  return `${hour.padStart(2, '0')}.${minute.padStart(2, '0')} WIB`;
}

function formatDateTimeId(dateValue, timeValue) {
  const dateText = formatDateId(dateValue);
  const timeText = formatTimeId(timeValue);
  return [dateText, timeText].filter((part) => part && part !== '-').join(' - ') || '-';
}

function getPlain(instance) {
  if (!instance) return null;
  if (typeof instance.get === 'function') return instance.get({ plain: true });
  return instance;
}

function getChildren(parent, lowerKey, upperKey) {
  return parent?.[lowerKey] || parent?.[upperKey] || [];
}

function normalizeLabStatus(value) {
  const text = String(value || '').trim().toUpperCase().replace(/_/g, ' ');
  if (text.includes('TIDAK MAMPU')) return 'Tidak Mampu';
  if (text === 'MAMPU') return 'Mampu';
  return '-';
}

function buildCatatan(row) {
  const notes = [];
  if (Number(row?.is_insitu) === 1 || row?.is_insitu === true || row?.isInsitu === true) notes.push('Insitu');

  const rawNote = String(row?.catatan_kemampuan || '').trim();
  if (rawNote && !/subkontrak/i.test(rawNote) && !/tidak\s*mampu/i.test(rawNote) && !/^mampu$/i.test(rawNote)) {
    notes.push(rawNote);
  }

  return notes.join('\n') || '-';
}

function getActiveFinalSampleSchedule(request = {}) {
  const schedules = getChildren(request, 'jadwal_sampels', 'JadwalSampels');
  return schedules
    .filter((schedule) => FINAL_SAMPLE_SCHEDULE_STATUSES.includes(schedule.status_jadwal || schedule.statusJadwal))
    .sort((a, b) => String(b.dibuat_pada || '').localeCompare(String(a.dibuat_pada || '')))[0] || null;
}

function getRegLabel(sample = {}) {
  const reg = sample.reg_bm || sample.RegBm || {};
  const instansi = reg.instansi || '';
  const ref = reg.ref_reg || reg.refReg || '';
  return [instansi, ref].filter(Boolean).join('\n') || '-';
}

function getSampleTypeName(sample = {}) {
  const jenis = sample.jenis_sampel || sample.JenisSampel || {};
  return jenis.jenis_sampel || jenis.jenisSampel || sample.id_jenis_sampel || '-';
}

function getParameterName(row = {}) {
  const parameter = row.parameter || row.Parameter || {};
  return parameter.nama_parameter || parameter.namaParameter || '-';
}

function getMethodName(row = {}) {
  const pm = row.parameter_metode || row.ParameterMetode || {};
  const metode = pm.metode || pm.Metode || {};
  return metode.nama_metode || metode.namaMetode || '-';
}

function getMethodReference(row = {}) {
  const pm = row.parameter_metode || row.ParameterMetode || {};
  return pm.acuan_metode || pm.acuanMetode || '-';
}

async function loadScheduleCreatorSigner(schedule = null) {
  const creatorNik = String(schedule?.dibuat_oleh || schedule?.dibuatOleh || '').trim();

  if (!creatorNik || !Pegawai || typeof Pegawai.findOne !== 'function') {
    return null;
  }

  const creator = await Pegawai.findOne({
    where: { nik: creatorNik },
    attributes: ['id_pegawai', 'nik', 'nama_pegawai', 'jabatan'],
  });

  return getPlain(creator);
}

async function loadFpplSigners(schedule = null) {
  if (!Pegawai || typeof Pegawai.findAll !== 'function') {
    return {};
  }

  const rows = await Pegawai.findAll({
    where: {
      jabatan: { [Op.in]: FPPL_SIGNER_JABATAN_VALUES },
    },
    attributes: ['id_pegawai', 'nik', 'nama_pegawai', 'jabatan'],
    order: [['jabatan', 'ASC'], ['id_pegawai', 'ASC']],
  });

  const signers = rows.reduce((acc, item) => {
    const row = getPlain(item) || {};
    const jabatan = String(row.jabatan || '').trim();

    if (jabatan === FPPL_SIGNER_JABATAN.KASUBAG_TU && !acc.KASUBAG_TU) {
      acc.KASUBAG_TU = row;
    }

    if (jabatan === FPPL_SIGNER_JABATAN.PENGELOLA_SAMPEL && !acc.PENGELOLA_SAMPEL) {
      acc.PENGELOLA_SAMPEL = row;
    }

    return acc;
  }, {});

  const scheduleCreator = await loadScheduleCreatorSigner(schedule);
  if (scheduleCreator?.nama_pegawai) {
    signers.PENGELOLA_SAMPEL = scheduleCreator;
  }

  return signers;
}

function getSignerName(signer = {}) {
  return String(signer.nama_pegawai || '').trim();
}

function groupParameterRows(request = {}) {
  const samples = getChildren(request, 'fppl_sampels', 'FpplSampels');
  const groupMap = new Map();

  samples.forEach((sample) => {
    const groupKey = `${sample.id_jenis_sampel || ''}__${sample.id_reg_bm || ''}`;
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        id_jenis_sampel: sample.id_jenis_sampel,
        id_reg_bm: sample.id_reg_bm,
        jenis_matrik: getSampleTypeName(sample),
        acuan_baku_mutu: getRegLabel(sample),
        rowMap: new Map(),
      });
    }

    const group = groupMap.get(groupKey);
    const fpmRows = getChildren(sample, 'fppl_parameter_metodes', 'FpplParameterMetodes');

    fpmRows.forEach((fpm) => {
      const parameter = fpm.parameter || fpm.Parameter || {};
      const pm = fpm.parameter_metode || fpm.ParameterMetode || {};
      const rowKey = [
        fpm.id_parameter || parameter.id_parameter || '',
        fpm.id_metode_parameter || pm.id_metode_parameter || '',
        normalizeLabStatus(fpm.status_kemampuan_lab),
        Number(fpm.is_insitu || 0),
        String(fpm.catatan_kemampuan || '').trim(),
      ].join('__');

      if (group.rowMap.has(rowKey)) return;

      group.rowMap.set(rowKey, {
        parameter: getParameterName(fpm),
        metode: getMethodName(fpm),
        acuan_metode: getMethodReference(fpm),
        status_lab: normalizeLabStatus(fpm.status_kemampuan_lab),
        catatan: buildCatatan(fpm),
      });
    });
  });

  return Array.from(groupMap.values()).map((group, index) => ({
    no: index + 1,
    jenis_matrik: group.jenis_matrik,
    acuan_baku_mutu: group.acuan_baku_mutu,
    parameters: Array.from(group.rowMap.values()),
  }));
}

async function loadFpplData(idRegistrasi) {
  const request = await Fppl.findByPk(idRegistrasi, {
    include: [
      {
        model: Pelanggan,
        as: 'pelanggan',
        attributes: ['id_pelanggan', 'nik', 'nama_instansi', 'pic', 'no_telp', 'alamat'],
      },
      {
        model: JadwalSampel,
        as: 'jadwal_sampels',
        required: false,
        attributes: ['id_jadwal', 'tanggal_jadwal', 'jam_jadwal', 'status_jadwal', 'dibuat_oleh', 'dibuat_pada'],
        where: { status_jadwal: { [Op.ne]: 'Dibatalkan' } },
      },
      {
        model: FpplSampel,
        as: 'fppl_sampels',
        attributes: ['id_fppl_sampel', 'id_jenis_sampel', 'id_reg_bm', 'jumlah_sampel'],
        include: [
          { model: JenisSampel, attributes: ['id_jenis_sampel', 'jenis_sampel'] },
          { model: RegBm, attributes: ['id_reg_bm', 'instansi', 'ref_reg'] },
          {
            model: FpplParameterMetode,
            attributes: [
              'id_fppl_parameter_metode',
              'id_fppl_sampel',
              'id_parameter',
              'id_metode_parameter',
              'status_kemampuan_lab',
              'catatan_kemampuan',
              'is_insitu',
            ],
            include: [
              { model: Parameter, attributes: ['id_parameter', 'nama_parameter'] },
              {
                model: ParameterMetode,
                required: false,
                attributes: ['id_metode_parameter', 'id_metode', 'acuan_metode', 'is_subkontrak'],
                include: [{ model: Metode, attributes: ['id_metode', 'nama_metode'], required: false }],
              },
            ],
          },
        ],
      },
      {
        model: Invoice,
        required: false,
        attributes: ['id_invoice', 'status_invoice', 'tanggal_invoice'],
      },
    ],
    order: [
      [{ model: JadwalSampel, as: 'jadwal_sampels' }, 'dibuat_pada', 'DESC'],
      [{ model: FpplSampel, as: 'fppl_sampels' }, 'id_fppl_sampel', 'ASC'],
      [{ model: FpplSampel, as: 'fppl_sampels' }, FpplParameterMetode, 'id_fppl_parameter_metode', 'ASC'],
    ],
  });

  if (!request) throw new Error('Permohonan tidak ditemukan.');

  const plain = getPlain(request);
  const invoices = getChildren(plain, 'invoices', 'Invoices');
  const latestInvoice = invoices
    .slice()
    .sort((a, b) => String(b.tanggal_invoice || '').localeCompare(String(a.tanggal_invoice || '')))[0] || null;
  const schedule = getActiveFinalSampleSchedule(plain);
  const signers = await loadFpplSigners(schedule);

  return {
    request: plain,
    pelanggan: plain.pelanggan || plain.Pelanggan || {},
    schedule,
    invoice: latestInvoice,
    groups: groupParameterRows(plain),
    signers,
  };
}

function assertCanGenerateFppl(data) {
  const { request, schedule, invoice, groups } = data;

  if (!request.nomor_fppl) {
    throw new Error('Nomor FPPL belum tersedia. Verifikasi pembayaran atau Bayar Nanti harus membuat nomor FPPL terlebih dahulu.');
  }

  if (!invoice || !CLEARED_INVOICE_STATUSES.includes(invoice.status_invoice)) {
    throw new Error('FPPL hanya dapat digenerate setelah invoice berstatus Lunas atau Bayar Nanti.');
  }

  if (!schedule) {
    throw new Error('FPPL hanya dapat digenerate setelah jadwal sampel disetujui pelanggan/admin.');
  }

  if (!groups.length || groups.every((group) => group.parameters.length === 0)) {
    throw new Error('Parameter pengujian belum tersedia atau belum ditentukan metode pengujiannya.');
  }

  if (!getSignerName(data.signers?.KASUBAG_TU)) {
    throw new Error("Penandatangan FPPL Kepala Sub Bagian Tata Usaha belum dikonfigurasi di data pegawai. Isi pegawai.jabatan = 'Kepala Sub Bagian Tata Usaha'.");
  }

  if (!getSignerName(data.signers?.PENGELOLA_SAMPEL)) {
    throw new Error("Penandatangan FPPL Pengelola Sampel Pengujian belum dapat ditentukan. Pastikan jadwal sampel memiliki dibuat_oleh yang terhubung ke pegawai, atau isi satu pegawai fallback dengan jabatan = 'Pengelola Sampel Pengujian'.");
  }
}

function registerFpplFonts(doc) {
  let regular = FONT.fallbackRegular;
  let bold = FONT.fallbackBold;

  try {
    if (fs.existsSync(FONT_REGULAR_PATH)) {
      doc.registerFont(FONT.regular, FONT_REGULAR_PATH);
      regular = FONT.regular;
    }
  } catch (error) {
    console.warn('Gagal memuat font CenturyGothic:', error.message);
  }

  try {
    if (fs.existsSync(FONT_BOLD_PATH)) {
      doc.registerFont(FONT.bold, FONT_BOLD_PATH);
      bold = FONT.bold;
    }
  } catch (error) {
    console.warn('Gagal memuat font CenturyGothic-Bold:', error.message);
  }

  return { regular, bold };
}

function setFont(doc, fonts, weight = 'regular', size = 8) {
  doc.font(weight === 'bold' ? fonts.bold : fonts.regular).fontSize(size).fillColor('#111111');
}

function textHeight(doc, value, width, options = {}) {
  return doc.heightOfString(valueOrDash(value), {
    width,
    lineGap: 0.5,
    ...options,
  });
}

function drawBoxText(doc, text, x, y, width, height, options = {}) {
  const {
    align = 'left',
    valign = 'top',
    paddingX = 2.5,
    paddingY = 3,
    lineGap = 0.5,
  } = options;

  const safeText = valueOrDash(text);
  const innerWidth = Math.max(8, width - (paddingX * 2));
  const measuredHeight = doc.heightOfString(safeText, { width: innerWidth, align, lineGap });
  const textY = valign === 'middle'
    ? y + Math.max(paddingY, (height - measuredHeight) / 2)
    : y + paddingY;

  doc.text(safeText, x + paddingX, textY, {
    width: innerWidth,
    align,
    lineGap,
  });
}

function drawHeader(doc, fonts) {
  const centerX = 106;
  const centerWidth = 382;

  setFont(doc, fonts, 'regular', 7.2);
  doc.text('No. Form: 7.1.2/F/LAB Revisi: 07', 405, 16, { width: 150, align: 'right', lineBreak: false });

  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, 58, 38, { width: 44, height: 44, fit: [44, 44] });
    } catch (error) {
      console.warn('Gagal memuat logo FPPL:', error.message);
    }
  }

  setFont(doc, fonts, 'bold', 10.6);
  doc.text('PEMERINTAH PROVINSI SUMATERA BARAT', centerX, 34, { width: centerWidth, align: 'center' });
  doc.text('DINAS LINGKUNGAN HIDUP', centerX, 48, { width: centerWidth, align: 'center' });
  doc.text('UPTD LABORATORIUM LINGKUNGAN', centerX, 62, { width: centerWidth, align: 'center' });

  setFont(doc, fonts, 'regular', 6.1);
  doc.text('Registrasi Kompetensi Laboratorium Lingkungan Nomor : 00274/LP/R/ABLING-1/LK/KLH', centerX, 78, { width: centerWidth, align: 'center' });
  doc.text('Jl. Khatib Sulaiman No. 22 Telp. (0751) 7055231 - 446571 - 445154  Fax. (0751) 449232 Padang', centerX, 88, { width: centerWidth, align: 'center' });
  doc.text('Website: http://dlh.sumbarprov.go.id  Email: dlh@sumbarprov.go.id lablingprovsumabar@gmail.com', centerX, 98, { width: centerWidth, align: 'center' });

  doc.moveTo(CONTENT_FRAME.x, 116).lineTo(CONTENT_FRAME.right, 116).lineWidth(1.1).strokeColor('#111111').stroke();
}

function drawFormTitle(doc, fonts, request = {}) {
  const titleY = 132;
  setFont(doc, fonts, 'bold', 10.2);
  doc.text('FORMULIR PERMINTAAN PENGUJIAN LABORATORIUM (FPPL)', CONTENT_FRAME.x, titleY, {
    width: CONTENT_FRAME.width,
    align: 'center',
    underline: true,
  });

  setFont(doc, fonts, 'regular', 8.1);
  doc.text(`Nomor: ${valueOrDash(request.nomor_fppl)}`, CONTENT_FRAME.x, titleY + 16, {
    width: CONTENT_FRAME.width,
    align: 'center',
    lineBreak: false,
  });

  return titleY + 31;
}

function drawFieldRows(doc, fonts, data, startY) {
  const { request, pelanggan, schedule } = data;
  const rows = [
    ['Nama pelanggan', pelanggan.pic || pelanggan.nama_instansi],
    ['Instansi/Perusahaan', pelanggan.nama_instansi],
    ['No. Telp/HP', pelanggan.no_telp],
    ['Alamat', pelanggan.alamat],
    ['Lokasi Pengambilan Sampel', request.lokasi_pengambilan_sampel],
    ['Tgl Pengambilan sampel', formatDateTimeId(schedule.tanggal_jadwal, schedule.jam_jadwal)],
  ];

  const outerX = CONTENT_FRAME.x;
  const outerW = CONTENT_FRAME.width;
  const x = outerX + 8;
  const yStart = startY || 166;
  const labelW = 150;
  const colonW = 14;
  const valueW = outerW - 8 - labelW - colonW - 16;
  const rowH = 17.5;
  const outerY = yStart - 4;
  const outerH = (rows.length * rowH) + 8;

  doc.rect(outerX, outerY, outerW, outerH).strokeColor('#111111').lineWidth(0.55).stroke();

  setFont(doc, fonts, 'regular', 8.0);
  rows.forEach(([label, value], index) => {
    const y = yStart + (index * rowH);
    doc.text(label, x, y + 2.4, { width: labelW, lineBreak: false });
    doc.text(':', x + labelW, y + 2.4, { width: colonW, align: 'center', lineBreak: false });
    doc.text(valueOrDash(value), x + labelW + colonW + 3, y + 2.4, { width: valueW, lineBreak: false });
  });

  return outerY + outerH + 34;
}

function drawTableHeader(doc, fonts, x, y, widths) {
  const headerHeight = 29;
  const labels = ['No', 'Jenis\nMatrik', 'Acuan Baku Mutu', 'Parameter', 'Metode', 'Acuan Metode', 'Status Lab', 'Catatan'];

  doc.save().rect(x, y, widths.reduce((a, b) => a + b, 0), headerHeight).fill('#F1F5F9').restore();
  setFont(doc, fonts, 'bold', 6.65);

  let currentX = x;
  labels.forEach((label, index) => {
    doc.rect(currentX, y, widths[index], headerHeight).strokeColor('#111111').lineWidth(0.45).stroke();
    drawBoxText(doc, label, currentX, y, widths[index], headerHeight, {
      align: 'center',
      valign: 'middle',
      paddingX: 2,
      paddingY: 2,
      lineGap: 0,
    });
    currentX += widths[index];
  });

  return headerHeight;
}

function measureParameterRowHeight(doc, fonts, row, widths) {
  setFont(doc, fonts, 'regular', 6.65);
  const values = [row.parameter, row.metode, row.acuan_metode, row.status_lab, row.catatan];
  const valueWidths = [widths[3], widths[4], widths[5], widths[6], widths[7]];
  const heights = values.map((value, index) => textHeight(doc, value, valueWidths[index] - 5));
  return Math.max(23, Math.ceil(Math.max(...heights) + 7));
}

function measureGroupSideHeight(doc, fonts, group, widths) {
  setFont(doc, fonts, 'regular', 6.5);
  const heights = [
    textHeight(doc, group.no, widths[0] - 4, { align: 'center' }),
    textHeight(doc, group.jenis_matrik, widths[1] - 4, { align: 'center' }),
    textHeight(doc, group.acuan_baku_mutu, widths[2] - 5, { align: 'center' }),
  ];
  return Math.ceil(Math.max(...heights) + 8);
}

function drawMergedCell(doc, fonts, text, x, y, width, height, options = {}) {
  const { bold = false, align = 'center' } = options;
  doc.rect(x, y, width, height).strokeColor('#111111').lineWidth(0.45).stroke();
  setFont(doc, fonts, bold ? 'bold' : 'regular', 6.5);
  drawBoxText(doc, text, x, y, width, height, {
    align,
    valign: 'middle',
    paddingX: 2.5,
    paddingY: 2,
    lineGap: 0.3,
  });
}

function drawParameterCell(doc, fonts, text, x, y, width, height, options = {}) {
  const { align = 'left', bold = false } = options;
  doc.rect(x, y, width, height).strokeColor('#111111').lineWidth(0.45).stroke();
  setFont(doc, fonts, bold ? 'bold' : 'regular', 6.55);
  drawBoxText(doc, text, x, y, width, height, {
    align,
    valign: 'middle',
    paddingX: 2.5,
    paddingY: 2,
    lineGap: 0.3,
  });
}

function ensureTablePage(doc, fonts, y, neededHeight, tableX, widths) {
  const tableBottom = PAGE.height - 205;
  if (y + neededHeight <= tableBottom) return y;

  doc.addPage();
  drawHeader(doc, fonts);
  let nextY = 136;
  setFont(doc, fonts, 'bold', 8.7);
  doc.text('RINCIAN PARAMETER PENGUJIAN', CONTENT_FRAME.x, nextY, {
    width: CONTENT_FRAME.width,
    align: 'center',
  });
  nextY += 17;
  return nextY + drawTableHeader(doc, fonts, tableX, nextY, widths);
}

function drawParameterTable(doc, fonts, startY, groups) {
  setFont(doc, fonts, 'bold', 8.7);
  doc.text('RINCIAN PARAMETER PENGUJIAN', CONTENT_FRAME.x, startY, {
    width: CONTENT_FRAME.width,
    align: 'center',
  });

  const tableX = CONTENT_FRAME.x;
  // Total harus sama dengan CONTENT_FRAME.width (519 pt).
  // Arah revisi: Acuan Baku Mutu diperkecil, Catatan diperlebar.
  const widths = [22, 60, 70, 66, 88, 82, 60, 71];
  let y = startY + 18;
  y += drawTableHeader(doc, fonts, tableX, y, widths);

  groups.forEach((group) => {
    const parameters = group.parameters.length ? group.parameters : [{ parameter: '-', metode: '-', acuan_metode: '-', status_lab: '-', catatan: '-' }];
    const rowHeights = parameters.map((row) => measureParameterRowHeight(doc, fonts, row, widths));
    const sideHeight = measureGroupSideHeight(doc, fonts, group, widths);
    if (sideHeight > rowHeights.reduce((sum, h) => sum + h, 0)) {
      rowHeights[0] += sideHeight - rowHeights.reduce((sum, h) => sum + h, 0);
    }

    const totalHeight = rowHeights.reduce((sum, height) => sum + height, 0);
    y = ensureTablePage(doc, fonts, y, totalHeight, tableX, widths);

    const groupTop = y;
    drawMergedCell(doc, fonts, group.no, tableX, groupTop, widths[0], totalHeight, { bold: true });
    drawMergedCell(doc, fonts, group.jenis_matrik, tableX + widths[0], groupTop, widths[1], totalHeight);
    drawMergedCell(doc, fonts, group.acuan_baku_mutu, tableX + widths[0] + widths[1], groupTop, widths[2], totalHeight);

    let rowY = groupTop;
    parameters.forEach((row, rowIndex) => {
      const height = rowHeights[rowIndex];
      let x = tableX + widths[0] + widths[1] + widths[2];
      drawParameterCell(doc, fonts, row.parameter, x, rowY, widths[3], height);
      x += widths[3];
      drawParameterCell(doc, fonts, row.metode, x, rowY, widths[4], height);
      x += widths[4];
      drawParameterCell(doc, fonts, row.acuan_metode, x, rowY, widths[5], height);
      x += widths[5];
      drawParameterCell(doc, fonts, row.status_lab, x, rowY, widths[6], height, { align: 'center' });
      x += widths[6];
      drawParameterCell(doc, fonts, row.catatan, x, rowY, widths[7], height, { align: 'center' });
      rowY += height;
    });

    y = groupTop + totalHeight;
  });

  return y;
}

function formatSignatureName(name) {
  const clean = valueOrDash(name).trim();
  return clean === '-' ? '(........................................)' : `(${clean})`;
}

function drawSignature(doc, fonts, startY, data = {}) {
  let y = Math.max(startY + 22, 645);
  if (y + 112 > PAGE.height - PAGE.bottom) {
    doc.addPage();
    y = 84;
  }

  const kasubag = data.signers?.KASUBAG_TU || {};
  const pengelola = data.signers?.PENGELOLA_SAMPEL || {};
  const pelanggan = data.pelanggan || {};

  const signatures = [
    {
      title: 'Kepala Sub Bagian Tata Usaha',
      name: getSignerName(kasubag),
      x: 42,
    },
    {
      title: 'Pengelola Sampel Pengujian',
      name: getSignerName(pengelola),
      x: 226,
    },
    {
      title: 'Pelanggan',
      name: pelanggan.pic || pelanggan.nama_instansi || '-',
      x: 410,
    },
  ];

  setFont(doc, fonts, 'regular', 8.3);
  doc.text(`Padang, ${formatDateId(new Date())}`, 374, y, { width: 150, align: 'center', lineBreak: false });

  signatures.forEach((item) => {
    setFont(doc, fonts, 'regular', 8.3);
    doc.text(item.title, item.x, y + 32, { width: 145, align: 'center' });

    setFont(doc, fonts, 'regular', 8.1);
    doc.text(formatSignatureName(item.name), item.x, y + 103, {
      width: 145,
      align: 'center',
      lineBreak: false,
    });
  });
}

function drawPageNumbers(doc, fonts) {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i += 1) {
    doc.switchToPage(i);
    setFont(doc, fonts, 'regular', 6.6);
    doc.fillColor('#111111');
    doc.text(`Halaman ${i + 1} dari ${pages.count}`, PAGE.left, PAGE.height - 54, {
      width: PAGE.width - PAGE.left - PAGE.right,
      align: 'right',
      lineBreak: false,
    });
  }
}

function generatePdfBuffer(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: PAGE.top, left: PAGE.left, right: PAGE.right, bottom: PAGE.bottom },
      bufferPages: true,
      autoFirstPage: true,
    });
    const chunks = [];
    const fonts = registerFpplFonts(doc);

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    drawHeader(doc, fonts);
    const titleBottomY = drawFormTitle(doc, fonts, data.request);
    const fieldBottomY = drawFieldRows(doc, fonts, data, titleBottomY + 6);
    const tableBottomY = drawParameterTable(doc, fonts, fieldBottomY, data.groups);
    drawSignature(doc, fonts, tableBottomY, data);
    drawPageNumbers(doc, fonts);

    doc.end();
  });
}

async function generateFpplPdfBuffer(idRegistrasi) {
  const data = await loadFpplData(idRegistrasi);
  assertCanGenerateFppl(data);
  const buffer = await generatePdfBuffer(data);
  const filename = `${safeFilename(data.request.nomor_fppl || idRegistrasi)}.pdf`;
  return { buffer, filename, data };
}

async function saveFpplPdf(idRegistrasi, actorNik = null) {
  const { buffer, filename, data } = await generateFpplPdfBuffer(idRegistrasi);
  ensureFpplDir();

  const absolutePath = path.join(FPPL_DIR, filename);
  fs.writeFileSync(absolutePath, buffer);

  const relativePath = `/fppl/${filename}`;

  await Fppl.update(
    { file_fppl: relativePath },
    { where: { id_registrasi: idRegistrasi } }
  );

  await WorkflowLogService.logStatusTransition({
    entityType: 'FPPL',
    entityId: idRegistrasi,
    action: 'GENERATE_DOKUMEN_FPPL',
    statusBefore: data.request.status_fppl || null,
    statusAfter: data.request.status_fppl || null,
    source: 'Sistem',
    note: 'Dokumen FPPL admin digenerate otomatis.',
    actorNik,
  });

  return {
    file_fppl: relativePath,
    fileFppl: relativePath,
    filename,
    absolutePath,
  };
}

async function tryGenerateFpplPdfIfReady(idRegistrasi, options = {}) {
  try {
    return await saveFpplPdf(idRegistrasi, options.actorNik || null);
  } catch (error) {
    const message = String(error?.message || '');
    const expected = [
      'Nomor FPPL belum tersedia',
      'FPPL hanya dapat digenerate setelah invoice berstatus',
      'FPPL hanya dapat digenerate setelah jadwal sampel disetujui',
      'Parameter pengujian belum tersedia',
      'Penandatangan FPPL',
    ].some((text) => message.includes(text));

    if (!expected) {
      console.error('tryGenerateFpplPdfIfReady error:', error);
    }

    return null;
  }
}

function resolveFpplPublicPath(relativePath = '') {
  const clean = String(relativePath || '').replace(/^\/+/, '').replace(/^public[\\/]/, '');
  if (!clean || clean.includes('..')) return null;
  return path.join(PUBLIC_DIR, clean);
}

module.exports = {
  CLEARED_INVOICE_STATUSES,
  FINAL_SAMPLE_SCHEDULE_STATUSES,
  generateFpplPdfBuffer,
  saveFpplPdf,
  tryGenerateFpplPdfIfReady,
  resolveFpplPublicPath,
};
