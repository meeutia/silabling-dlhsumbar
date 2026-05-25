-- SILABLING domain migration: 006_create_assignment_lka_tables.sql
-- Structure only. Do not put transaction/sample data in this file.

CREATE TABLE IF NOT EXISTS `penugasan` (
  `id_penugasan` varchar(10) NOT NULL,
  `id_user_analis` varchar(16) DEFAULT NULL,
  `assigned_by` varchar(16) DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `jenis_penugasan` enum('INTERNAL','SUBKONTRAK') NOT NULL DEFAULT 'INTERNAL',
  `status_penugasan` enum('Draft','Aktif','Selesai','Dibatalkan') NOT NULL DEFAULT 'Draft',
  `catatan_penugasan` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `penugasan_detail` (
  `id_penugasan_detail` varchar(10) NOT NULL,
  `id_penugasan` varchar(10) NOT NULL,
  `id_metode_parameter` varchar(6) NOT NULL,
  `status_detail` enum('Draft','Ditugaskan','Sedang Dikerjakan','Worksheet Terkirim','Perlu Revisi','Disetujui','Selesai') NOT NULL DEFAULT 'Draft',
  `tanggal_tenggat` date DEFAULT NULL,
  `catatan_detail` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `penugasan_item` (
  `id_penugasan_detail` varchar(10) NOT NULL,
  `no_sampel` varchar(25) NOT NULL,
  `tanggal_penugasan` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `lka` (
  `kode_lka` varchar(20) NOT NULL,
  `id_penugasan_detail` varchar(10) NOT NULL,
  `tanggal_mulai_pengujian` date DEFAULT NULL,
  `tanggal_selesai_pengujian` date DEFAULT NULL,
  `dhl_akuades` varchar(50) DEFAULT NULL,
  `file_worksheet_path` text,
  `dilaporkan_oleh` varchar(16) DEFAULT NULL,
  `tanggal_pelaporan` date DEFAULT NULL,
  `diperiksa_oleh` varchar(16) DEFAULT NULL,
  `tanggal_pemeriksaan` date DEFAULT NULL,
  `status_lka` enum('Draft','Menunggu Verifikasi Penyelia','Perlu Perbaikan','Disetujui Penyelia','Menunggu Verifikasi Kasi Pengujian','Disetujui Kasi Pengujian','Disahkan') NOT NULL DEFAULT 'Draft'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `lka_hasil` (
  `kode_lka` varchar(20) NOT NULL,
  `no_sampel` varchar(25) NOT NULL,
  `hasil` varchar(50) DEFAULT NULL,
  `catatan_hasil` text,
  `status_review_hasil` enum('Draft','Menunggu Verifikasi Penyelia','Disetujui Penyelia','Menunggu Verifikasi Kasi Pengujian','Menunggu Persetujuan Penyelia Atas Revisi Kasi','Disetujui Kasi Pengujian','Perlu Revisi') NOT NULL DEFAULT 'Draft'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `lka_revisi` (
  `id_revisi_lka` varchar(10) NOT NULL,
  `kode_lka` varchar(20) NOT NULL,
  `sumber_revisi` enum('PENYELIA','KASI_PENGUJIAN') NOT NULL,
  `level_revisi` enum('LKA','HASIL') NOT NULL,
  `catatan_umum` text,
  `diajukan_oleh` varchar(16) NOT NULL,
  `diajukan_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status_revisi` enum('Diajukan','Menunggu Persetujuan Penyelia','Disetujui Penyelia','Ditolak Penyelia','Dikirim ke Analis','Selesai') NOT NULL DEFAULT 'Diajukan',
  `ditinjau_oleh` varchar(16) DEFAULT NULL,
  `ditinjau_pada` datetime DEFAULT NULL,
  `catatan_tinjauan` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `lka_revisi_item` (
  `id_revisi_item` varchar(10) NOT NULL,
  `id_revisi_lka` varchar(10) NOT NULL,
  `kode_lka` varchar(20) NOT NULL,
  `no_sampel` varchar(25) NOT NULL,
  `catatan_revisi` text,
  `status_item_revisi` enum('Menunggu Review Penyelia','Ditolak Penyelia','Disetujui untuk Analis','Diperbaiki Analis','Disetujui Penyelia','Disetujui Kasi') NOT NULL DEFAULT 'Menunggu Review Penyelia',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
