-- SILABLING domain migration: 005_create_schedule_sample_tables.sql
-- Structure only. Do not put transaction/sample data in this file.

CREATE TABLE IF NOT EXISTS `jadwal_sampel` (
  `id_jadwal` varchar(10) NOT NULL,
  `id_registrasi` varchar(10) NOT NULL,
  `tanggal_jadwal` date NOT NULL,
  `jam_jadwal` time NOT NULL,
  `id_pegawai_pcc` varchar(10) DEFAULT NULL,
  `dibuat_oleh` varchar(16) DEFAULT NULL,
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status_jadwal` enum('Terjadwal','Disetujui Pelanggan','Disetujui Admin','Selesai','Dibatalkan') NOT NULL DEFAULT 'Terjadwal'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pengajuan_perubahan_jadwal` (
  `id_pengajuan_jadwal` varchar(20) NOT NULL,
  `jenis_jadwal` enum('SAMPEL','LHU') NOT NULL,
  `id_registrasi` varchar(10) NOT NULL,
  `id_jadwal_sampel` varchar(10) DEFAULT NULL,
  `id_jadwal_lhu` varchar(10) DEFAULT NULL,
  `tanggal_sebelumnya` date DEFAULT NULL,
  `jam_sebelumnya` time DEFAULT NULL,
  `tanggal_usulan` date NOT NULL,
  `jam_usulan` time DEFAULT NULL,
  `alasan_pengajuan` text NOT NULL,
  `status_pengajuan` enum('Menunggu Persetujuan Admin','Disetujui','Ditolak','Dibatalkan Pelanggan') NOT NULL DEFAULT 'Menunggu Persetujuan Admin',
  `catatan_admin` text,
  `diajukan_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `jadwal_pengambilan_lhu` (
  `id_jadwal_lhu` varchar(10) NOT NULL,
  `id_registrasi` varchar(10) NOT NULL,
  `tanggal_pengambilan` date NOT NULL,
  `jam_pengambilan` time DEFAULT NULL,
  `status_pengambilan` enum('Dijadwalkan','Disetujui Pelanggan','Disetujui Admin','Sudah Diambil','Dibatalkan') NOT NULL DEFAULT 'Dijadwalkan',
  `catatan` text,
  `dijadwalkan_oleh` varchar(16) DEFAULT NULL,
  `dijadwalkan_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `nama_pengambil` varchar(100) DEFAULT NULL,
  `diambil_pada` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `sampel` (
  `no_sampel` varchar(25) NOT NULL,
  `id_fppl_sampel` varchar(13) NOT NULL,
  `tanggal_pengambilan_sampel` date DEFAULT NULL,
  `diterima_pada` datetime DEFAULT NULL,
  `lokasi_spesifik` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `koordinat` varchar(100) DEFAULT NULL,
  `kondisi_sampel` enum('Sesuai','Tidak Sesuai') NOT NULL DEFAULT 'Sesuai',
  `abnormalitas_sampel` varchar(30) DEFAULT NULL,
  `acuan_pengambilan_sampel` varchar(20) DEFAULT NULL,
  `diterima_oleh` varchar(16) DEFAULT NULL,
  `status_sample` enum('Menunggu Pengambilan','Diterima','Dalam Pengujian','Selesai') NOT NULL DEFAULT 'Menunggu Pengambilan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `sampel_parameter` (
  `no_sampel` varchar(25) NOT NULL,
  `id_fppl_parameter_metode` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
