-- SILABLING domain migration: 008_create_notification_tables.sql
-- Structure only. Do not put transaction/sample data in this file.

CREATE TABLE IF NOT EXISTS `tipe_notifikasi` (
  `id_tipe_notifikasi` varchar(10) NOT NULL,
  `deskripsi` varchar(100) NOT NULL,
  `konteks` enum('FPPL','JADWAL_LHU','JADWAL','LHU','PENUGASAN','UMUM') NOT NULL DEFAULT 'UMUM'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `notifikasi_email` (
  `id_notifikasi_email` varchar(15) NOT NULL,
  `id_tipe_notifikasi` varchar(10) NOT NULL,
  `penerima_user_nik` varchar(16) DEFAULT NULL,
  `penerima_pelanggan_id` varchar(8) DEFAULT NULL,
  `id_registrasi` varchar(10) DEFAULT NULL,
  `id_jadwal_lhu` varchar(10) DEFAULT NULL,
  `nomor_lhu` varchar(20) DEFAULT NULL,
  `id_penugasan` varchar(10) DEFAULT NULL,
  `status_pengiriman` enum('MENUNGGU','TERKIRIM','GAGAL') NOT NULL DEFAULT 'MENUNGGU',
  `pesan_error` text,
  `dikirim_pada` datetime DEFAULT NULL,
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `diperbarui_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
