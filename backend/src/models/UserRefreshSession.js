const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRefreshSession = sequelize.define('user_refresh_session', {
  id_refresh_session: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nik: {
    type: DataTypes.STRING(16),
    allowNull: false,
  },
  refresh_token_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  refresh_token_expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'user_refresh_session',
  timestamps: false,
});

module.exports = UserRefreshSession;
