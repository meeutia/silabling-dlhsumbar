-- SILABLING domain migration: 001_create_identity_access_tables.sql
-- Structure only. Do not put transaction/sample data in this file.

CREATE TABLE IF NOT EXISTS `role` (
  `id_role` varchar(10) NOT NULL,
  `nama_role` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user` (
  `nik` varchar(16) NOT NULL,
  `id_role` varchar(10) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `refresh_token_hash` varchar(64) DEFAULT NULL,
  `refresh_token_expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `reset_password_token_hash` varchar(64) DEFAULT NULL,
  `reset_password_expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pegawai` (
  `id_pegawai` varchar(10) NOT NULL,
  `nik` varchar(16) DEFAULT NULL,
  `nip` varchar(18) DEFAULT NULL,
  `nama_pegawai` varchar(100) NOT NULL,
  `jabatan` varchar(100) DEFAULT NULL,
  `no_wa` varchar(13) DEFAULT NULL,
  `is_pcc` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pelanggan` (
  `id_pelanggan` varchar(8) NOT NULL,
  `nik` varchar(16) NOT NULL,
  `nama_instansi` varchar(100) NOT NULL,
  `no_telp` varchar(20) NOT NULL,
  `alamat` varchar(100) DEFAULT NULL,
  `email_kontak` varchar(50) DEFAULT NULL,
  `pic` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
