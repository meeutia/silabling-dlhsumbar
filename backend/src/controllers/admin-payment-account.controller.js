const PaymentAccountService = require('../services/admin-payment-account.service');
const { successResponse, errorResponse } = require('../utils/response');

function getActorNik(req) {
  return req.user?.nik || req.user?.id || null;
}

async function getPaymentAccounts(req, res) {
  try {
    const data = await PaymentAccountService.getAllPaymentAccounts();
    return successResponse(res, 'Data rekening pembayaran berhasil dimuat.', data);
  } catch (error) {
    return errorResponse(res, error.message || 'Gagal memuat data rekening pembayaran.', error.statusCode || 500);
  }
}

async function createPaymentAccount(req, res) {
  try {
    const data = await PaymentAccountService.createPaymentAccount(req.body, getActorNik(req));
    return successResponse(res, 'Rekening pembayaran berhasil ditambahkan.', data, 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Gagal menambahkan rekening pembayaran.', error.statusCode || 400);
  }
}

async function updatePaymentAccount(req, res) {
  try {
    const data = await PaymentAccountService.updatePaymentAccount(req.params.idRekening, req.body, getActorNik(req));
    return successResponse(res, 'Rekening pembayaran berhasil diperbarui.', data);
  } catch (error) {
    return errorResponse(res, error.message || 'Gagal memperbarui rekening pembayaran.', error.statusCode || 400);
  }
}

async function deletePaymentAccount(req, res) {
  try {
    await PaymentAccountService.deletePaymentAccount(req.params.idRekening);
    return successResponse(res, 'Rekening pembayaran berhasil dihapus.');
  } catch (error) {
    return errorResponse(res, error.message || 'Gagal menghapus rekening pembayaran.', error.statusCode || 400);
  }
}

module.exports = {
  getPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
};
