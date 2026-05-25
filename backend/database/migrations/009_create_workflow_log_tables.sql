-- SILABLING domain migration: 009_create_workflow_log_tables.sql
-- Structure only. Do not put transaction/sample data in this file.

CREATE TABLE IF NOT EXISTS `aktivitas_sistem_log` (
  `id_aktivitas_log` varchar(13) NOT NULL,
  `entity_type` varchar(30) NOT NULL,
  `entity_id` varchar(30) NOT NULL,
  `aksi` varchar(50) NOT NULL,
  `status_sebelumnya` varchar(50) DEFAULT NULL,
  `status_baru` varchar(50) DEFAULT NULL,
  `sumber_aksi` enum('Pelanggan','Admin','Kasi','Penyelia','Analis','QC','Kalab','Sistem') NOT NULL DEFAULT 'Sistem',
  `catatan` text,
  `dibuat_oleh` varchar(16) DEFAULT NULL,
  `dibuat_pada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
