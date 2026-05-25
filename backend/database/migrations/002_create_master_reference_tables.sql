-- SILABLING domain migration: 002_create_master_reference_tables.sql
-- Structure only. Do not put transaction/sample data in this file.

CREATE TABLE IF NOT EXISTS `jenis_sampel` (
  `id_jenis_sampel` varchar(4) NOT NULL,
  `jenis_sampel` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `kategori_parameter` (
  `id_kategori_parameter` varchar(4) NOT NULL,
  `nama_kategori` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `metode` (
  `id_metode` varchar(4) NOT NULL,
  `nama_metode` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `parameter` (
  `id_parameter` varchar(6) NOT NULL,
  `id_kategori_parameter` varchar(4) DEFAULT NULL,
  `nama_parameter` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `parameter_metode` (
  `id_metode_parameter` varchar(6) NOT NULL,
  `id_parameter` varchar(6) NOT NULL,
  `id_metode` varchar(4) NOT NULL,
  `tarif` bigint UNSIGNED NOT NULL DEFAULT '0',
  `acuan_metode` varchar(100) DEFAULT NULL,
  `is_terakreditasi` tinyint(1) NOT NULL DEFAULT '0',
  `is_subkontrak` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `reg_bm` (
  `id_reg_bm` varchar(6) NOT NULL,
  `instansi` varchar(50) NOT NULL,
  `ref_reg` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `tarif_pengambilan` (
  `id_tarif_pengambilan` varchar(10) NOT NULL,
  `keterangan_jarak` varchar(50) DEFAULT NULL,
  `tarif` bigint UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pkt_bm` (
  `id_pkt_bm` varchar(8) NOT NULL,
  `id_reg_bm` varchar(6) NOT NULL,
  `id_jenis_sampel` varchar(4) NOT NULL,
  `klasifikasi` varchar(10) DEFAULT NULL,
  `nama_pkt` varchar(30) NOT NULL,
  `teks_lhu` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pkt_bm_param` (
  `id_pkt_bm_param` varchar(10) NOT NULL,
  `id_pkt_bm` varchar(8) NOT NULL,
  `id_parameter` varchar(6) NOT NULL,
  `nilai_bm` varchar(10) DEFAULT NULL,
  `satuan_bm` varchar(10) DEFAULT NULL,
  `ket_bm` varchar(255) DEFAULT NULL,
  `is_in_bm` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pkt_bm_pm` (
  `id_pkt_bm_param` varchar(10) NOT NULL,
  `id_metode_parameter` varchar(6) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
