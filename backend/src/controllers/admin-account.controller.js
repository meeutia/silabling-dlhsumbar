const AdminAccountService = require('../services/admin-account.service');
const { successResponse, errorResponse } = require('../utils/response');

function normalizeAdminAccountError(error) {
  const message = error?.message || '';

  if (
    error?.name === 'SequelizeForeignKeyConstraintError' ||
    message.includes('fk_user_role') ||
    message.includes('FOREIGN KEY (`id_role`)')
  ) {
    return new Error('Role akun belum tersedia di database. Jalankan patch role PSP atau muat ulang halaman Kelola Akun, lalu coba lagi.');
  }

  return error;
}

function getErrorCode(error) {
  const message = error.message || '';

  if (
    message.includes('wajib') ||
    message.includes('tidak valid') ||
    message.includes('minimal') ||
    message.includes('tidak sesuai') ||
    message.includes('tidak boleh') ||
    message.includes('Minimal harus ada') ||
    message.includes('Role akun belum tersedia')
  ) {
    return 400;
  }

  if (message.includes('tidak ditemukan')) {
    return 404;
  }

  if (
    message.includes('sudah terdaftar') ||
    message.includes('sudah digunakan')
  ) {
    return 409;
  }

  return 500;
}

async function getRoles(req, res) {
  try {
    const roles = await AdminAccountService.listRoles();
    return successResponse(res, 'Daftar role berhasil dimuat.', { roles }, 200);
  } catch (error) {
    const normalizedError = normalizeAdminAccountError(error);
    console.error('getRoles error:', normalizedError.message);
    return errorResponse(res, normalizedError.message, getErrorCode(normalizedError));
  }
}

async function getStaffAccounts(req, res) {
  try {
    const staff = await AdminAccountService.listStaff(req.query);
    return successResponse(res, 'Daftar akun petugas berhasil dimuat.', { staff }, 200);
  } catch (error) {
    const normalizedError = normalizeAdminAccountError(error);
    console.error('getStaffAccounts error:', normalizedError.message);
    return errorResponse(res, normalizedError.message, getErrorCode(normalizedError));
  }
}

async function getStaffAccountDetail(req, res) {
  try {
    const staff = await AdminAccountService.getStaffByNik(req.params.nik);
    return successResponse(res, 'Detail akun petugas berhasil dimuat.', { staff }, 200);
  } catch (error) {
    const normalizedError = normalizeAdminAccountError(error);
    console.error('getStaffAccountDetail error:', normalizedError.message);
    return errorResponse(res, normalizedError.message, getErrorCode(normalizedError));
  }
}

async function createStaffAccount(req, res) {
  try {
    const result = await AdminAccountService.createStaff(req.body);
    return successResponse(res, 'Akun petugas berhasil dibuat.', result, 201);
  } catch (error) {
    const normalizedError = normalizeAdminAccountError(error);
    console.error('createStaffAccount error:', normalizedError.message);
    return errorResponse(res, normalizedError.message, getErrorCode(normalizedError));
  }
}

async function updateStaffStatus(req, res) {
  try {
    const staff = await AdminAccountService.setStaffStatus(
      req.params.nik,
      req.body.is_active ?? req.body.isActive
    );

    return successResponse(res, 'Status akun petugas berhasil diperbarui.', { staff }, 200);
  } catch (error) {
    const normalizedError = normalizeAdminAccountError(error);
    console.error('updateStaffStatus error:', normalizedError.message);
    return errorResponse(res, normalizedError.message, getErrorCode(normalizedError));
  }
}

async function resetStaffPassword(req, res) {
  try {
    const result = await AdminAccountService.resetStaffPassword(req.params.nik, req.body);
    return successResponse(res, 'Password akun petugas berhasil direset.', result, 200);
  } catch (error) {
    const normalizedError = normalizeAdminAccountError(error);
    console.error('resetStaffPassword error:', normalizedError.message);
    return errorResponse(res, normalizedError.message, getErrorCode(normalizedError));
  }
}

async function getCustomerAccounts(req, res) {
  try {
    const customers = await AdminAccountService.listCustomers(req.query);
    return successResponse(res, 'Daftar akun pelanggan berhasil dimuat.', { customers }, 200);
  } catch (error) {
    const normalizedError = normalizeAdminAccountError(error);
    console.error('getCustomerAccounts error:', normalizedError.message);
    return errorResponse(res, normalizedError.message, getErrorCode(normalizedError));
  }
}

async function getCustomerAccountDetail(req, res) {
  try {
    const customer = await AdminAccountService.getCustomerById(req.params.idPelanggan);
    return successResponse(res, 'Detail pelanggan berhasil dimuat.', { customer }, 200);
  } catch (error) {
    const normalizedError = normalizeAdminAccountError(error);
    console.error('getCustomerAccountDetail error:', normalizedError.message);
    return errorResponse(res, normalizedError.message, getErrorCode(normalizedError));
  }
}

async function updateCustomerStatus(req, res) {
  try {
    const customer = await AdminAccountService.setCustomerStatus(
      req.params.idPelanggan,
      req.body.is_active ?? req.body.isActive
    );

    return successResponse(res, 'Status pelanggan berhasil diperbarui.', { customer }, 200);
  } catch (error) {
    const normalizedError = normalizeAdminAccountError(error);
    console.error('updateCustomerStatus error:', normalizedError.message);
    return errorResponse(res, normalizedError.message, getErrorCode(normalizedError));
  }
}

async function resetCustomerPassword(req, res) {
  try {
    const result = await AdminAccountService.resetCustomerPassword(
      req.params.idPelanggan,
      req.body
    );

    return successResponse(res, 'Password pelanggan berhasil direset.', result, 200);
  } catch (error) {
    const normalizedError = normalizeAdminAccountError(error);
    console.error('resetCustomerPassword error:', normalizedError.message);
    return errorResponse(res, normalizedError.message, getErrorCode(normalizedError));
  }
}


module.exports = {
  getRoles,

  getStaffAccounts,
  getStaffAccountDetail,
  createStaffAccount,
  updateStaffStatus,
  resetStaffPassword,

  getCustomerAccounts,
  getCustomerAccountDetail,
  updateCustomerStatus,
  resetCustomerPassword,
};