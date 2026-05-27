-- SILABLING domain migration: 012_create_rekening_pembayaran_table.sql
-- Bank account information for payments

CREATE TABLE IF NOT EXISTS `rekening_pembayaran` (
  `id_rekening` varchar(10) NOT NULL,
  `nama_bank` varchar(100) NOT NULL,
  `nomor_rekening` varchar(50) NOT NULL,
  `nama_pemilik` varchar(150) NOT NULL,
  `catatan` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` varchar(16) DEFAULT NULL,
  `updated_by` varchar(16) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rekening`),
  KEY `idx_rekening_is_active` (`is_active`),
  KEY `idx_rekening_is_primary` (`is_primary`),
  KEY `idx_rekening_created_by` (`created_by`),
  KEY `idx_rekening_updated_by` (`updated_by`),
  CONSTRAINT `fk_rekening_created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_rekening_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
