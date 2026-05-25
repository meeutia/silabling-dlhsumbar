-- SILABLING domain migration: 003_create_fppl_request_tables.sql
-- Structure only. Do not put transaction/sample data in this file.

CREATE TABLE IF NOT EXISTS `fppl` (
  `id_registrasi` varchar(10) NOT NULL,
  `nomor_fppl` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `file_fppl` varchar(255) DEFAULT NULL,
  `id_pelanggan` varchar(8) NOT NULL,
  `tanggal_pendaftaran` datetime NOT NULL,
  `maksud_pengujian` text,
  `lokasi_pengambilan_sampel` varchar(100) DEFAULT NULL,
  `jenis_pengambilan_sampel` enum('Petugas','Mandiri') NOT NULL,
  `id_tarif_pengambilan` varchar(10) DEFAULT NULL,
  `tanggal_rencana_pengambilan_sampel` date DEFAULT NULL,
  `jam_rencana_pengambilan_sampel` time DEFAULT NULL,
  `tanggal_rencana_pengantaran_sampel` date DEFAULT NULL,
  `status_fppl` enum('Menunggu Verifikasi','Menunggu Penentuan Metode','Menunggu Pembayaran','Menunggu Verifikasi Pembayaran','Menunggu Sampel','Proses Pengujian','Selesai','Dibatalkan','Dibatalkan Pelanggan','Ditolak Admin','Ditolak Kasi','Ditolak Penyelia') NOT NULL DEFAULT 'Menunggu Verifikasi',
  `catatan_penolakan` text,
  `tanggal_verifikasi` datetime DEFAULT NULL,
  `diverifikasi_oleh` varchar(16) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `fppl_sampel` (
  `id_fppl_sampel` varchar(13) NOT NULL,
  `id_registrasi` varchar(10) NOT NULL,
  `id_jenis_sampel` varchar(4) NOT NULL,
  `id_reg_bm` varchar(6) NOT NULL,
  `jumlah_sampel` int UNSIGNED NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `fppl_parameter_metode` (
  `id_fppl_parameter_metode` varchar(15) NOT NULL,
  `id_fppl_sampel` varchar(13) NOT NULL,
  `id_parameter` varchar(6) NOT NULL,
  `id_metode_parameter` varchar(6) DEFAULT NULL,
  `status_kemampuan_lab` enum('MAMPU','TIDAK_MAMPU') DEFAULT NULL,
  `catatan_kemampuan` text,
  `dipilih_oleh` varchar(16) DEFAULT NULL,
  `dipilih_pada` datetime DEFAULT NULL,
  `is_insitu` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
