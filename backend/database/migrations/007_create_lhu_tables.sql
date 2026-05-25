-- SILABLING domain migration: 007_create_lhu_tables.sql
-- Structure only. Do not put transaction/sample data in this file.

CREATE TABLE IF NOT EXISTS `lhu` (
  `nomor_lhu` varchar(20) NOT NULL,
  `id_registrasi` varchar(10) NOT NULL,
  `id_pkt_bm` varchar(8) NOT NULL,
  `tanggal_penerbitan` date DEFAULT NULL,
  `file_lhu_path` varchar(255) DEFAULT NULL,
  `qc_by` varchar(16) DEFAULT NULL,
  `qc_at` datetime DEFAULT NULL,
  `kalab_by` varchar(16) DEFAULT NULL,
  `kalab_at` datetime DEFAULT NULL,
  `status_lhu` enum('Draft','Menunggu QC','Menunggu Persetujuan Kepala Lab','Disahkan','Dibatalkan') NOT NULL DEFAULT 'Menunggu Persetujuan Kepala Lab',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `lhu_sampel` (
  `nomor_lhu` varchar(20) NOT NULL,
  `no_sampel` varchar(25) NOT NULL,
  `urutan_sampel` int UNSIGNED NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `detail_lhu` (
  `nomor_lhu` varchar(20) NOT NULL,
  `id_fppl_parameter_metode` varchar(15) NOT NULL,
  `urutan_lhu` int UNSIGNED NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
