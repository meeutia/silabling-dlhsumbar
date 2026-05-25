const {
  sequelize,
  Fppl,
  Invoice,
  Payment,
} = require('../../models/Associations');

const RequestStatus = require('../../constants/request-status');
const { generateId, generateNomorFppl } = require('../../utils/id-generator');
const WorkflowLogService = require('../workflow/workflow-log.service');
const FpplDocumentService = require('../fppl/fppl-document.service');

const {
  buildInvoiceSummary,
  createOrRefreshInvoiceForRequest,
  ensureCustomerOwnsRequest,
  updateCustomerApprovalStatus,
} = require('./payment-billing.service');

const {
  INTERNAL_PAYMENT_METHOD,
  getAvailablePaymentMethods,
  normalizeAmount,
  resolvePaymentMethod,
} = require('./payment-policy.util');

const getInvoiceTotal = (invoice) => {
  return normalizeAmount(invoice?.subtotal_uji) + normalizeAmount(invoice?.subtotal_pengambilan);
};

const ensureManualPaymentRow = async ({ invoice, methodCode, transaction }) => {
  let payment = await Payment.findOne({
    where: { id_invoice: invoice.id_invoice },
    order: [['id_payment', 'DESC']],
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  const payload = {
    metode_bayar: methodCode,
    jumlah_bayar: getInvoiceTotal(invoice),
    paid_at: null,
    status_verifikasi: 'Menunggu Verifikasi',
    bukti_bayar_path: null,
    verified_by: null,
    verified_at: null,
    catatan_verifikasi: null,
  };

  if (!payment) {
    const paymentId = await generateId(Payment, 'id_payment', 'PAY-', transaction, 3);
    payment = await Payment.create(
      {
        id_payment: paymentId,
        id_invoice: invoice.id_invoice,
        ...payload,
      },
      { transaction }
    );
    return payment;
  }

  if (payment.status_verifikasi === 'Terverifikasi') {
    throw new Error('Pembayaran sudah terverifikasi. Data pembayaran baru tidak dapat dibuat.');
  }

  await payment.update(payload, { transaction });
  return payment;
};

const createGatewayPayment = async (requestId, userNik, paymentMethodCode = 'MANUAL_TRANSFER') => {
  const t = await sequelize.transaction();

  try {
    const requestRecord = await ensureCustomerOwnsRequest(requestId, userNik, t);

    if (requestRecord.status_fppl !== RequestStatus.WAITING_PAYMENT) {
      throw new Error(
        `Permohonan tidak bisa diproses ke pembayaran manual karena status saat ini: ${requestRecord.status_fppl}`
      );
    }

    const method = resolvePaymentMethod(paymentMethodCode || 'MANUAL_TRANSFER');

    if (!method || method.code === INTERNAL_PAYMENT_METHOD.code) {
      throw new Error('Metode pembayaran tidak valid. Pilih metode Transfer Manual.');
    }

    await updateCustomerApprovalStatus(requestId, 'Disetujui', t);
    const invoice = await createOrRefreshInvoiceForRequest(requestId, t);

    if (getInvoiceTotal(invoice) <= 0) {
      throw new Error('Total tagihan harus lebih dari 0 untuk membuat pembayaran manual.');
    }

    await ensureManualPaymentRow({
      invoice,
      methodCode: method.code,
      transaction: t,
    });

    await invoice.update(
      {
        status_invoice: 'Belum Dibayar',
      },
      { transaction: t }
    );

    await t.commit();
    return buildInvoiceSummary(requestId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const rejectInvoiceByCustomer = async (requestId, userNik, rejectionNote = null) => {
  const t = await sequelize.transaction();

  try {
    const requestRecord = await ensureCustomerOwnsRequest(requestId, userNik, t);
    const allowedStatuses = [RequestStatus.WAITING_PAYMENT, RequestStatus.WAITING_PAYMENT_VERIFICATION];

    if (!allowedStatuses.includes(requestRecord.status_fppl)) {
      throw new Error(
        `Permohonan tidak bisa ditolak pelanggan karena status saat ini: ${requestRecord.status_fppl}`
      );
    }

    const invoice = await Invoice.findOne({
      where: { id_registrasi: requestId },
      order: [['tanggal_invoice', 'DESC']],
      transaction: t
    });

    if (invoice) {
      await invoice.update({ status_invoice: 'Dibatalkan' }, { transaction: t });
    }

    const previousStatus = requestRecord.status_fppl;
    await requestRecord.update(
      {
        status_fppl: RequestStatus.CANCELLED_BY_CUSTOMER,
        catatan_penolakan: rejectionNote || null
      },
      { transaction: t }
    );

    await WorkflowLogService.logStatusTransition({
      entityType: 'FPPL',
      entityId: requestRecord.id_registrasi,
      action: 'MEMBATALKAN_PERMOHONAN_PELANGGAN',
      statusBefore: previousStatus,
      statusAfter: RequestStatus.CANCELLED_BY_CUSTOMER,
      source: 'Pelanggan',
      note: rejectionNote || null,
      actorNik: userNik,
      transaction: t,
    });

    await t.commit();

    return {
      id_registrasi: requestRecord.id_registrasi,
      status: RequestStatus.CANCELLED_BY_CUSTOMER
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const confirmPaymentSubmitted = async (requestId, userNik, proofFile = null) => {
  if (!proofFile) {
    throw new Error('Bukti pembayaran wajib diupload sebelum konfirmasi pembayaran.');
  }

  const t = await sequelize.transaction();

  try {
    const requestRecord = await ensureCustomerOwnsRequest(requestId, userNik, t);

    if (![RequestStatus.WAITING_PAYMENT, RequestStatus.WAITING_PAYMENT_VERIFICATION].includes(requestRecord.status_fppl)) {
      throw new Error(`Pembayaran tidak dapat dikonfirmasi pada status saat ini: ${requestRecord.status_fppl}`);
    }

    const invoice = await Invoice.findOne({
      where: { id_registrasi: requestId },
      order: [['tanggal_invoice', 'DESC']],
      transaction: t
    });

    if (!invoice) {
      throw new Error('Invoice belum tersedia.');
    }

    let payment = await Payment.findOne({
      where: { id_invoice: invoice.id_invoice },
      order: [['id_payment', 'DESC']],
      transaction: t
    });

    if (!payment) {
      payment = await ensureManualPaymentRow({
        invoice,
        methodCode: 'MANUAL_TRANSFER',
        transaction: t,
      });
    }

    if ([INTERNAL_PAYMENT_METHOD.code, 'MANUAL', 'PEMBAYARAN_AKHIR_ADMIN'].includes(String(payment.metode_bayar || '').toUpperCase())) {
      throw new Error('Permohonan ini dicatat sebagai Bayar Nanti oleh admin.');
    }

    await payment.update(
      {
        jumlah_bayar: getInvoiceTotal(invoice),
        paid_at: new Date(),
        status_verifikasi: 'Menunggu Verifikasi',
        bukti_bayar_path: proofFile.relativePath,
        verified_by: null,
        verified_at: null,
        catatan_verifikasi: null,
      },
      { transaction: t }
    );

    await invoice.update(
      {
        status_invoice: 'Menunggu Verifikasi'
      },
      { transaction: t }
    );

    const previousStatus = requestRecord.status_fppl;
    await requestRecord.update(
      {
        status_fppl: RequestStatus.WAITING_PAYMENT_VERIFICATION,
        catatan_penolakan: null
      },
      { transaction: t }
    );

    await WorkflowLogService.logStatusTransition({
      entityType: 'FPPL',
      entityId: requestRecord.id_registrasi,
      action: 'MENGUPLOAD_BUKTI_PEMBAYARAN',
      statusBefore: previousStatus,
      statusAfter: RequestStatus.WAITING_PAYMENT_VERIFICATION,
      source: 'Pelanggan',
      note: 'Pelanggan mengupload bukti pembayaran dan menunggu verifikasi admin.',
      actorNik: userNik,
      transaction: t,
    });

    await t.commit();
    return buildInvoiceSummary(requestId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const markDeferredPaymentByAdmin = async (requestId, adminNik, note) => {
  const t = await sequelize.transaction();

  try {
    const normalizedNote = String(note || '').trim();
    const deferredVerificationNote = normalizedNote
      ? `Bayar Nanti (admin). ${normalizedNote}`
      : 'Bayar Nanti (admin). Dicatat admin sebagai skema Bayar Nanti.';

    const requestRecord = await Fppl.findByPk(requestId, { transaction: t });

    if (!requestRecord) {
      throw new Error('Permohonan tidak ditemukan.');
    }

    if (requestRecord.status_fppl !== RequestStatus.WAITING_PAYMENT) {
      throw new Error(
        `Permohonan tidak bisa dicatat sebagai Bayar Nanti karena status saat ini: ${requestRecord.status_fppl}`
      );
    }

    await updateCustomerApprovalStatus(requestId, 'Disetujui', t);
    const invoice = await createOrRefreshInvoiceForRequest(requestId, t);

    let payment = await Payment.findOne({
      where: { id_invoice: invoice.id_invoice },
      order: [['id_payment', 'DESC']],
      transaction: t
    });

    const paymentPayload = {
      metode_bayar: INTERNAL_PAYMENT_METHOD.code,
      jumlah_bayar: getInvoiceTotal(invoice),
      paid_at: null,
      status_verifikasi: 'Terverifikasi',
      bukti_bayar_path: null,
      verified_by: adminNik,
      verified_at: new Date(),
      catatan_verifikasi: deferredVerificationNote,
    };

    if (!payment) {
      const paymentId = await generateId(Payment, 'id_payment', 'PAY-', t, 3);
      payment = await Payment.create(
        {
          id_payment: paymentId,
          id_invoice: invoice.id_invoice,
          ...paymentPayload,
        },
        { transaction: t }
      );
    } else {
      await payment.update(paymentPayload, { transaction: t });
    }

    await invoice.update(
      {
        status_invoice: 'Bayar Nanti',
        file_invoice_path: null,
      },
      { transaction: t }
    );

    const previousStatus = requestRecord.status_fppl;
    await requestRecord.update(
      {
        status_fppl: RequestStatus.WAITING_SAMPLE,
        catatan_penolakan: null
      },
      { transaction: t }
    );

    await WorkflowLogService.logStatusTransition({
      entityType: 'FPPL',
      entityId: requestRecord.id_registrasi,
      action: 'MENCATAT_BAYAR_NANTI',
      statusBefore: previousStatus,
      statusAfter: RequestStatus.WAITING_SAMPLE,
      source: 'Admin',
      note: deferredVerificationNote,
      actorNik: adminNik,
      transaction: t,
    });

    let nomorFppl = requestRecord.nomor_fppl;

    if (!nomorFppl) {
      nomorFppl = await generateNomorFppl(Fppl, t, invoice.tanggal_invoice || new Date());
      await requestRecord.update(
        {
          nomor_fppl: nomorFppl,
          tanggal_verifikasi: requestRecord.tanggal_verifikasi || new Date(),
        },
        { transaction: t }
      );
    }

    await t.commit();

    const fpplDocument = await FpplDocumentService.tryGenerateFpplPdfIfReady(requestId, {
      actorNik: adminNik,
    });
    const summary = await buildInvoiceSummary(requestId);

    return {
      ...summary,
      id_registrasi: requestRecord.id_registrasi,
      nomor_fppl: nomorFppl,
      nomorFppl,
      file_fppl: fpplDocument?.file_fppl || null,
      fileFppl: fpplDocument?.file_fppl || null,
      status: RequestStatus.WAITING_SAMPLE
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const verifyPaymentByAdmin = async (requestId, verifierNik, action, note) => {
  const t = await sequelize.transaction();

  try {
    const requestRecord = await Fppl.findByPk(requestId, { transaction: t });

    if (!requestRecord) {
      throw new Error('Permohonan tidak ditemukan.');
    }

    if (requestRecord.status_fppl !== RequestStatus.WAITING_PAYMENT_VERIFICATION) {
      throw new Error(`Permohonan tidak dalam status Menunggu Verifikasi Pembayaran. Status saat ini: ${requestRecord.status_fppl}`);
    }

    const invoice = await Invoice.findOne({
      where: { id_registrasi: requestId },
      order: [['tanggal_invoice', 'DESC']],
      transaction: t
    });

    if (!invoice) {
      throw new Error('Invoice tidak ditemukan.');
    }

    const payment = await Payment.findOne({
      where: { id_invoice: invoice.id_invoice },
      order: [['id_payment', 'DESC']],
      transaction: t
    });

    if (!payment) {
      throw new Error('Data pembayaran tidak ditemukan.');
    }

    if (!payment.bukti_bayar_path) {
      throw new Error('Bukti pembayaran belum diupload pelanggan.');
    }

    if ([INTERNAL_PAYMENT_METHOD.code, 'MANUAL', 'PEMBAYARAN_AKHIR_ADMIN'].includes(String(payment.metode_bayar || '').toUpperCase())) {
      throw new Error('Permohonan ini menggunakan Bayar Nanti dan tidak memerlukan verifikasi bukti pembayaran.');
    }

    const normalizedAction = String(action || '').trim().toLowerCase();

    if (normalizedAction === 'approve') {
      await payment.update({
        status_verifikasi: 'Terverifikasi',
        verified_by: verifierNik,
        verified_at: new Date(),
        catatan_verifikasi: note || 'Pembayaran diverifikasi admin.',
        paid_at: payment.paid_at || new Date(),
      }, { transaction: t });

      await invoice.update({
        status_invoice: 'Lunas',
        file_invoice_path: null,
      }, { transaction: t });

      const previousStatus = requestRecord.status_fppl;
      await requestRecord.update(
        {
          status_fppl: RequestStatus.WAITING_SAMPLE,
          catatan_penolakan: null
        },
        { transaction: t }
      );

      let nomorFppl = requestRecord.nomor_fppl;

      if (!nomorFppl) {
        nomorFppl = await generateNomorFppl(Fppl, t, invoice.tanggal_invoice || new Date());
        await requestRecord.update(
          {
            nomor_fppl: nomorFppl,
            tanggal_verifikasi: requestRecord.tanggal_verifikasi || new Date(),
          },
          { transaction: t }
        );
      }

      await WorkflowLogService.logStatusTransition({
        entityType: 'FPPL',
        entityId: requestRecord.id_registrasi,
        action: 'PEMBAYARAN_DIVERIFIKASI_ADMIN',
        statusBefore: previousStatus,
        statusAfter: RequestStatus.WAITING_SAMPLE,
        source: 'Admin',
        note: note || 'Bukti pembayaran diterima admin.',
        actorNik: verifierNik,
        transaction: t,
      });

      await t.commit();

      const fpplDocument = await FpplDocumentService.tryGenerateFpplPdfIfReady(requestId, {
        actorNik: verifierNik,
      });

      return {
        id_registrasi: requestRecord.id_registrasi,
        nomor_fppl: nomorFppl,
        nomorFppl,
        file_fppl: fpplDocument?.file_fppl || null,
        fileFppl: fpplDocument?.file_fppl || null,
        status: RequestStatus.WAITING_SAMPLE,
        payment_status: 'Terverifikasi',
      };
    }

    await payment.update({
      status_verifikasi: 'Ditolak',
      verified_by: verifierNik,
      verified_at: new Date(),
      catatan_verifikasi: note || 'Pembayaran ditolak oleh admin.',
      paid_at: null,
    }, { transaction: t });

    await invoice.update({ status_invoice: 'Belum Dibayar' }, { transaction: t });

    const previousStatus = requestRecord.status_fppl;
    await requestRecord.update({
      status_fppl: RequestStatus.WAITING_PAYMENT,
      catatan_penolakan: null,
    }, { transaction: t });

    await WorkflowLogService.logStatusTransition({
      entityType: 'FPPL',
      entityId: requestRecord.id_registrasi,
      action: 'PEMBAYARAN_DITOLAK_ADMIN',
      statusBefore: previousStatus,
      statusAfter: RequestStatus.WAITING_PAYMENT,
      source: 'Admin',
      note: note || 'Bukti pembayaran ditolak admin.',
      actorNik: verifierNik,
      transaction: t,
    });

    await t.commit();

    return {
      id_registrasi: requestRecord.id_registrasi,
      status: RequestStatus.WAITING_PAYMENT,
      payment_status: 'Ditolak',
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const handleXenditPaymentSessionWebhook = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Webhook Xendit dinonaktifkan pada versi pembayaran manual.',
  });
};

const syncXenditPaymentStatusFromReturn = async () => {
  return { skipped: true, reason: 'manual_payment_version' };
};

const createXenditPaymentSession = async () => {
  throw new Error('Xendit dinonaktifkan pada versi pembayaran manual.');
};

module.exports = {
  getAvailablePaymentMethods,
  createOrRefreshInvoiceForRequest,
  buildInvoiceSummary,
  createGatewayPayment,
  rejectInvoiceByCustomer,
  confirmPaymentSubmitted,
  verifyPaymentByAdmin,
  markDeferredPaymentByAdmin,
  handleXenditPaymentSessionWebhook,
  syncXenditPaymentStatusFromReturn,
  createXenditPaymentSession,
};
