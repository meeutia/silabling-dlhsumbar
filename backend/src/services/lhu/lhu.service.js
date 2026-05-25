const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const lhuPdfService = require('./lhu-pdf.service');
const { ensureLhuPdfFile } = require('./lhu-file.service');
const {
  calculateAccreditationStats,
  getPlain,
  getPersonelOptions,
  getSampleInfosForLhu,
  getPktBmHeaderById,
  getDetailLhuRows,
  getPegawaiDisplayName,
  mapLhuHeaderPayload,
  mapSamplePayload,
  mapPelangganPayload,
  buildLhuListRow,
} = require('./lhu-data.service');
const {
  getFinalizationQueue,
  getFinalizationDetail,
  getPaketBmOptions,
  previewFinalization,
  finalizeLhu,
} = require('./lhu-finalization.service');
const assignmentService = require('../assignment.service');
const notificationService = require('../notification/notification.service');
const WorkflowLogService = require('../workflow/workflow-log.service');
const { generateNomorLhu } = require('../../utils/id-generator');
const {
  User,
  Pegawai,
  Role,
  Pelanggan,
  Fppl,
  JadwalSampel,
  FpplSampel,
  JenisSampel,
  RegBm,
  PktBm,
  PktBmParam,
  PktBmPm,
  Parameter,
  Metode,
  ParameterMetode,
  FpplParameterMetode,
  Sampel,
  SampelParameter,
  PenugasanItem,
  PenugasanDetail,
  Lka,
  LkaHasil,
  Lhu,
  LhuSampel,
  DetailLhu,
} = require('../../models/Associations');
const {
  LHU_STATUS,
  LHU_EDITABLE_BY_QC_STATUSES,
  LHU_NEXT_STATUS,
  isLhuEditableByQc,
} = require('../../constants/lhu-status.constant');
const { buildLkaHasilRevisionResponse } = require('../assignment/assignment-revision.helper');

async function getLhuDetail(nomorLhu) {
  const lhuNo = String(nomorLhu || '').trim();

  if (!lhuNo) {
    throw new Error('Nomor LHU wajib dikirim.');
  }

  const lhuInstance = await Lhu.findOne({
    where: { nomor_lhu: lhuNo },
  });

  if (!lhuInstance) {
    throw new Error('LHU tidak ditemukan.');
  }

  let lhuPlain = getPlain(lhuInstance);
  lhuPlain = await ensureLhuPdfFile(lhuPlain);

  const sampleInfos = await getSampleInfosForLhu(lhuPlain.nomor_lhu);
  const sampleInfo = sampleInfos[0] || {};
  const pktBm = await getPktBmHeaderById(lhuPlain.id_pkt_bm);
  const details = await getDetailLhuRows(lhuNo);

  const [qcNama, kalabNama] = await Promise.all([
    getPegawaiDisplayName(lhuPlain.qc_by),
    getPegawaiDisplayName(lhuPlain.kalab_by),
  ]);

  const samplePayloads = sampleInfos.map(mapSamplePayload);
  const sampleNos = sampleInfos.map((info) => info.no_sampel).filter(Boolean);
  const noSampelText = sampleNos.join('\n') || null;

  const lhu = {
    ...mapLhuHeaderPayload(lhuPlain, sampleInfo, pktBm, {
      qcNama,
      kalabNama,
    }),
    noSampel: noSampelText,
    no_sampel: noSampelText,
    sampleNos,
    sample_nos: sampleNos,
    daftarSampelFinalisasiQc: noSampelText,
    daftar_sampel_finalisasi_qc: noSampelText,
  };

  return {
    lhu,
    sample: mapSamplePayload(sampleInfo),
    samples: samplePayloads,
    sampels: samplePayloads,
    sampleNos,
    sample_nos: sampleNos,
    daftarSampelFinalisasiQc: noSampelText,
    daftar_sampel_finalisasi_qc: noSampelText,
    pelanggan: mapPelangganPayload(sampleInfo),
    details,
    akreditasi: calculateAccreditationStats(details),
  };
}

async function getKasiPengujianQueue() {
  throw new Error(
    'Queue Kasi Pengujian sekarang menggunakan assignment.service.js, bukan lhu.service.js.'
  );
}

async function approveKasiPengujian() {
  throw new Error(
    'Approval Kasi Pengujian sekarang menggunakan review hasil sampel, bukan tabel LHU.'
  );
}

async function reviseKasiPengujian() {
  throw new Error(
    'Revisi Kasi Pengujian sekarang menggunakan review hasil sampel, bukan tabel LHU.'
  );
}

async function getFinalizationHistory() {
  const rows = await Lhu.findAll({
    where: {
      [Op.or]: [
        { qc_by: { [Op.ne]: null } },
        {
          status_lhu: {
            [Op.in]: [
              LHU_STATUS.WAIT_KALAB,
              LHU_STATUS.APPROVED_FINAL,
            ],
          },
        },
      ],
    },
    order: [
      ['qc_at', 'DESC'],
      ['updated_at', 'DESC'],
      ['created_at', 'DESC'],
      ['nomor_lhu', 'DESC'],
    ],
  });

  const mappedRows = [];

  for (const instance of rows) {
    mappedRows.push(await buildLhuListRow(getPlain(instance)));
  }

  return mappedRows;
}

async function getKalabApprovalQueue() {
  const rows = await Lhu.findAll({
    where: {
      status_lhu: LHU_STATUS.WAIT_KALAB,
    },
    order: [
      ['qc_at', 'ASC'],
      ['created_at', 'ASC'],
      ['nomor_lhu', 'ASC'],
    ],
  });

  const mappedRows = [];

  for (const instance of rows) {
    mappedRows.push(await buildLhuListRow(getPlain(instance)));
  }

  return mappedRows;
}

async function approveByKalab(nomorLhu, currentNik) {
  const lhuNo = String(nomorLhu || '').trim();
  const userNik = String(currentNik || '').trim();

  if (!lhuNo) {
    throw new Error('Nomor LHU wajib dikirim.');
  }

  if (!userNik) {
    throw new Error('User Kepala Lab tidak valid.');
  }

  return sequelize.transaction(async (transaction) => {
    const lhu = await Lhu.findOne({
      where: { nomor_lhu: lhuNo },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!lhu) {
      throw new Error('LHU tidak ditemukan.');
    }

    if (lhu.status_lhu !== LHU_STATUS.WAIT_KALAB) {
      throw new Error('LHU ini tidak berada pada tahap persetujuan Kepala Lab.');
    }

    await lhu.update(
      {
        tanggal_penerbitan: new Date(),
        kalab_by: userNik,
        kalab_at: new Date(),
        status_lhu: LHU_STATUS.APPROVED_FINAL,
      },
      { transaction }
    );

    const pdfResult = await lhuPdfService.generateFinalLhuPdf(
      lhuNo,
      transaction
    );

    await lhu.update(
      {
        file_lhu_path: pdfResult.filePath,
      },
      { transaction }
    );

    await WorkflowLogService.logStatusTransition({
      entityType: 'LHU',
      entityId: lhuNo,
      action: 'KALAB_MENGESAHKAN_LHU',
      statusBefore: LHU_STATUS.WAIT_KALAB,
      statusAfter: LHU_STATUS.APPROVED_FINAL,
      source: 'Kalab',
      note: 'LHU disahkan oleh Kepala Laboratorium.',
      actorNik: userNik,
      transaction,
    });

    return {
      nomorLhu: lhuNo,
      nomor_lhu: lhuNo,
      statusLhu: LHU_STATUS.APPROVED_FINAL,
      status_lhu: LHU_STATUS.APPROVED_FINAL,
      fileLhuPath: pdfResult.filePath,
      file_lhu_path: pdfResult.filePath,
    };
  });
}

module.exports = {
  getFinalizationQueue,
  getFinalizationDetail,
  getPaketBmOptions,
  previewFinalization,
  finalizeLhu,
  getPersonelOptions,

  getLhuDetail,
  getKasiPengujianQueue,
  approveKasiPengujian,
  reviseKasiPengujian,
  getFinalizationHistory,
  getKalabApprovalQueue,
  approveByKalab,

};