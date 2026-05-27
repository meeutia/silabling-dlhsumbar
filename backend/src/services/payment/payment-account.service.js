const manualPaymentConfig = require('../../config/manual-payment.config');
const { RekeningPembayaran } = require('../../models/Associations');

function fallbackInstruction() {
  return {
    idRekening: null,
    id_rekening: null,
    ...manualPaymentConfig,
    source: 'env',
    isPrimary: true,
    is_primary: 1,
  };
}

function toPaymentInstruction(row) {
  if (!row) return fallbackInstruction();
  const plain = typeof row.get === 'function' ? row.get({ plain: true }) : row;
  const note = plain.catatan || manualPaymentConfig.note;

  return {
    idRekening: plain.id_rekening,
    id_rekening: plain.id_rekening,
    bankName: plain.nama_bank,
    bank_name: plain.nama_bank,
    accountNumber: plain.nomor_rekening,
    account_number: plain.nomor_rekening,
    accountName: plain.nama_pemilik,
    account_name: plain.nama_pemilik,
    note,
    catatan: note,
    isPrimary: Boolean(plain.is_primary),
    is_primary: plain.is_primary ? 1 : 0,
    source: 'database',
  };
}


async function getActivePaymentInstructions() {
  try {
    const rows = await RekeningPembayaran.findAll({
      where: { is_active: 1 },
      order: [
        ['is_primary', 'DESC'],
        ['updated_at', 'DESC'],
        ['id_rekening', 'ASC'],
      ],
    });

    const accounts = rows.map(toPaymentInstruction).filter(Boolean);
    return accounts.length > 0 ? accounts : [fallbackInstruction()];
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('getActivePaymentInstructions fallback:', error?.message || error);
    }
    return [fallbackInstruction()];
  }
}

async function getActivePaymentInstruction() {
  try {
    const primary = await RekeningPembayaran.findOne({
      where: { is_active: 1, is_primary: 1 },
      order: [['updated_at', 'DESC'], ['id_rekening', 'ASC']],
    });

    if (primary) return toPaymentInstruction(primary);

    const firstActive = await RekeningPembayaran.findOne({
      where: { is_active: 1 },
      order: [['updated_at', 'DESC'], ['id_rekening', 'ASC']],
    });

    return toPaymentInstruction(firstActive);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('getActivePaymentInstruction fallback:', error?.message || error);
    }
    return fallbackInstruction();
  }
}

module.exports = {
  getActivePaymentInstruction,
  getActivePaymentInstructions,
};
