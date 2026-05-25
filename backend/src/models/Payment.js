const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('payment', {
    id_payment: {
        type: DataTypes.STRING(16),
        primaryKey: true
    },
    id_invoice: {
        type: DataTypes.STRING(16),
        allowNull: false
    },
    metode_bayar: {
        // Versi manual payment: pelanggan upload bukti bayar, admin verifikasi.
        // BAYAR_NANTI_ADMIN hanya dipakai admin untuk pembayaran di akhir.
        type: DataTypes.STRING(50),
        allowNull: true
    },
    jumlah_bayar: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
    },
    bukti_bayar_path: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    paid_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status_verifikasi: {
        type: DataTypes.ENUM('Menunggu Verifikasi', 'Terverifikasi', 'Ditolak'),
        allowNull: false,
        defaultValue: 'Menunggu Verifikasi'
    },
    verified_by: {
        type: DataTypes.STRING(16),
        allowNull: true
    },
    verified_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    catatan_verifikasi: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

module.exports = Payment;
