const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RekeningPembayaran = sequelize.define('rekening_pembayaran', {
  id_rekening: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false,
  },
  nama_bank: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  nomor_rekening: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  nama_pemilik: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  catatan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
  is_primary: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  created_by: {
    type: DataTypes.STRING(16),
    allowNull: true,
  },
  updated_by: {
    type: DataTypes.STRING(16),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'rekening_pembayaran',
  timestamps: false,
});

module.exports = RekeningPembayaran;
