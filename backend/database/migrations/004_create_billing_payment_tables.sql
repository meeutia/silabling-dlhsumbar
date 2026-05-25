-- SILABLING domain migration: 004_create_billing_payment_tables.sql
-- Structure only. Do not put transaction/sample data in this file.

CREATE TABLE IF NOT EXISTS `invoice` (
  `id_invoice` varchar(16) NOT NULL,
  `id_registrasi` varchar(10) NOT NULL,
  `tanggal_invoice` datetime DEFAULT NULL,
  `subtotal_uji` bigint UNSIGNED NOT NULL DEFAULT '0',
  `subtotal_pengambilan` bigint UNSIGNED NOT NULL DEFAULT '0',
  `status_invoice` enum('Belum Dibayar','Menunggu Verifikasi','Lunas','Dibatalkan','Bayar Nanti') NOT NULL DEFAULT 'Belum Dibayar',
  `file_invoice_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `invoice_item` (
  `id_invoice` varchar(16) NOT NULL,
  `id_fppl_parameter_metode` varchar(15) NOT NULL,
  `qty` int UNSIGNED NOT NULL DEFAULT '1',
  `tarif_invoice` bigint UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payment` (
  `id_payment` varchar(16) NOT NULL,
  `id_invoice` varchar(16) NOT NULL,
  `metode_bayar` varchar(50) DEFAULT NULL,
  `jumlah_bayar` decimal(15,2) NOT NULL DEFAULT '0.00',
  `bukti_bayar_path` varchar(255) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `status_verifikasi` enum('Menunggu Verifikasi','Terverifikasi','Ditolak') NOT NULL DEFAULT 'Menunggu Verifikasi',
  `verified_by` varchar(16) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `catatan_verifikasi` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
