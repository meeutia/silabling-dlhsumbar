-- SILABLING domain migration: 011_create_refresh_session_table.sql
-- Session management for JWT refresh tokens

CREATE TABLE IF NOT EXISTS `user_refresh_session` (
  `id_refresh_session` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `nik` varchar(16) NOT NULL,
  `refresh_token_hash` varchar(64) NOT NULL UNIQUE,
  `refresh_token_expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_refresh_session`),
  UNIQUE KEY `uq_refresh_token_hash` (`refresh_token_hash`),
  KEY `idx_refresh_session_nik` (`nik`),
  KEY `idx_refresh_session_expires_at` (`refresh_token_expires_at`),
  KEY `idx_refresh_session_revoked_at` (`revoked_at`),
  CONSTRAINT `fk_refresh_session_user_nik` FOREIGN KEY (`nik`) REFERENCES `user` (`nik`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
