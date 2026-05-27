const { Op } = require('sequelize');
const { sequelize, RekeningPembayaran } = require('../models/Associations');
const { generateId } = require('../utils/id-generator');

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeBooleanFlag(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return ['1', 'true', 'yes', 'on', 'aktif', 'utama'].includes(String(value).trim().toLowerCase());
}

function normalizeAccountNumber(value) {
  return String(value || '')
    .replace(/[\s.-]/g, '')
    .replace(/[^0-9]/g, '')
    .slice(0, 50);
}

function toPayload(row) {
  if (!row) return null;
  const plain = typeof row.get === 'function' ? row.get({ plain: true }) : row;

  return {
    ...plain,
    is_active: Number(plain.is_active) === 1,
    is_primary: Number(plain.is_primary) === 1,
  };
}

function validatePayload(payload = {}) {
  const namaBank = normalizeText(payload.nama_bank || payload.namaBank || payload.bankName);
  const nomorRekening = normalizeAccountNumber(payload.nomor_rekening || payload.nomorRekening || payload.accountNumber);
  const namaPemilik = normalizeText(payload.nama_pemilik || payload.namaPemilik || payload.accountName);
  const catatan = normalizeText(payload.catatan || payload.note || payload.keterangan);
  const isActive = normalizeBooleanFlag(payload.is_active ?? payload.isActive, true);
  const isPrimary = normalizeBooleanFlag(payload.is_primary ?? payload.isPrimary, false);

  if (!namaBank) {
    const error = new Error('Nama bank wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  if (namaBank.length > 100) {
    const error = new Error('Nama bank maksimal 100 karakter.');
    error.statusCode = 400;
    throw error;
  }

  if (!nomorRekening) {
    const error = new Error('Nomor rekening wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  if (nomorRekening.length < 6) {
    const error = new Error('Nomor rekening minimal 6 digit.');
    error.statusCode = 400;
    throw error;
  }

  if (!namaPemilik) {
    const error = new Error('Nama pemilik rekening wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  if (namaPemilik.length > 150) {
    const error = new Error('Nama pemilik rekening maksimal 150 karakter.');
    error.statusCode = 400;
    throw error;
  }

  return {
    nama_bank: namaBank,
    nomor_rekening: nomorRekening,
    nama_pemilik: namaPemilik,
    catatan: catatan || null,
    is_active: isActive ? 1 : 0,
    is_primary: isPrimary ? 1 : 0,
  };
}

async function ensureNoDuplicate({ namaBank, nomorRekening, excludeId = null, transaction = null }) {
  const where = {
    nama_bank: namaBank,
    nomor_rekening: nomorRekening,
  };

  if (excludeId) {
    where.id_rekening = { [Op.ne]: excludeId };
  }

  const existing = await RekeningPembayaran.findOne({ where, transaction });
  if (existing) {
    const error = new Error(`Rekening ${namaBank} ${nomorRekening} sudah ada.`);
    error.statusCode = 409;
    throw error;
  }
}

async function countActiveExcept(idRekening = null, transaction = null) {
  const where = { is_active: 1 };
  if (idRekening) {
    where.id_rekening = { [Op.ne]: idRekening };
  }
  return RekeningPembayaran.count({ where, transaction });
}

async function setPrimaryAccount(idRekening, transaction) {
  await RekeningPembayaran.update(
    { is_primary: 0, updated_at: new Date() },
    {
      where: {
        id_rekening: { [Op.ne]: idRekening },
      },
      transaction,
    }
  );

  await RekeningPembayaran.update(
    { is_primary: 1, is_active: 1, updated_at: new Date() },
    { where: { id_rekening: idRekening }, transaction }
  );
}

async function promotePrimaryIfNeeded(transaction) {
  const primary = await RekeningPembayaran.findOne({
    where: { is_active: 1, is_primary: 1 },
    transaction,
  });

  if (primary) return;

  const firstActive = await RekeningPembayaran.findOne({
    where: { is_active: 1 },
    order: [['updated_at', 'DESC'], ['id_rekening', 'ASC']],
    transaction,
  });

  if (firstActive) {
    await firstActive.update({ is_primary: 1, updated_at: new Date() }, { transaction });
  }
}

async function getAllPaymentAccounts() {
  const rows = await RekeningPembayaran.findAll({
    order: [
      ['is_primary', 'DESC'],
      ['is_active', 'DESC'],
      ['updated_at', 'DESC'],
      ['id_rekening', 'ASC'],
    ],
  });

  return rows.map(toPayload);
}

async function createPaymentAccount(payload, actorNik = null) {
  const data = validatePayload(payload);

  return sequelize.transaction(async (transaction) => {
    await ensureNoDuplicate({
      namaBank: data.nama_bank,
      nomorRekening: data.nomor_rekening,
      transaction,
    });

    const activeCount = await countActiveExcept(null, transaction);
    const idRekening = await generateId(RekeningPembayaran, 'id_rekening', 'RK-', transaction, 3);
    const shouldBePrimary = data.is_primary === 1 || activeCount === 0;

    const row = await RekeningPembayaran.create(
      {
        ...data,
        id_rekening: idRekening,
        is_active: shouldBePrimary ? 1 : data.is_active,
        is_primary: shouldBePrimary ? 1 : data.is_primary,
        created_by: actorNik || null,
        updated_by: actorNik || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction }
    );

    if (Number(row.is_primary) === 1) {
      await setPrimaryAccount(row.id_rekening, transaction);
    }

    return toPayload(await RekeningPembayaran.findByPk(row.id_rekening, { transaction }));
  });
}

async function updatePaymentAccount(idRekening, payload, actorNik = null) {
  return sequelize.transaction(async (transaction) => {
    const row = await RekeningPembayaran.findByPk(idRekening, { transaction });
    if (!row) {
      const error = new Error('Rekening pembayaran tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    const data = validatePayload(payload);

    await ensureNoDuplicate({
      namaBank: data.nama_bank,
      nomorRekening: data.nomor_rekening,
      excludeId: idRekening,
      transaction,
    });

    if (Number(row.is_active) === 1 && data.is_active !== 1) {
      const otherActiveCount = await countActiveExcept(idRekening, transaction);
      if (otherActiveCount < 1) {
        const error = new Error('Minimal satu rekening pembayaran aktif wajib tersedia.');
        error.statusCode = 400;
        throw error;
      }
    }

    await row.update(
      {
        ...data,
        is_primary: data.is_active === 1 ? data.is_primary : 0,
        updated_by: actorNik || null,
        updated_at: new Date(),
      },
      { transaction }
    );

    if (data.is_active === 1 && data.is_primary === 1) {
      await setPrimaryAccount(idRekening, transaction);
    }

    await promotePrimaryIfNeeded(transaction);

    return toPayload(await RekeningPembayaran.findByPk(idRekening, { transaction }));
  });
}

async function deletePaymentAccount(idRekening) {
  return sequelize.transaction(async (transaction) => {
    const row = await RekeningPembayaran.findByPk(idRekening, { transaction });
    if (!row) {
      const error = new Error('Rekening pembayaran tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (Number(row.is_active) === 1) {
      const otherActiveCount = await countActiveExcept(idRekening, transaction);
      if (otherActiveCount < 1) {
        const error = new Error('Minimal satu rekening pembayaran aktif wajib tersedia.');
        error.statusCode = 400;
        throw error;
      }
    }

    await row.destroy({ transaction });
    await promotePrimaryIfNeeded(transaction);

    return true;
  });
}

module.exports = {
  getAllPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
};
