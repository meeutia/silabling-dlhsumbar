-- SILABLING domain migration: indexes and foreign keys
-- Run after all domain table migrations.

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `aktivitas_sistem_log`
  ADD PRIMARY KEY (`id_aktivitas_log`),
  ADD KEY `idx_aktivitas_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_aktivitas_dibuat_pada` (`dibuat_pada`),
  ADD KEY `idx_aktivitas_dibuat_oleh` (`dibuat_oleh`),
  ADD KEY `idx_aktivitas_aksi` (`aksi`);

ALTER TABLE `detail_lhu`
  ADD PRIMARY KEY (`nomor_lhu`,`id_fppl_parameter_metode`),
  ADD KEY `idx_detail_lhu_header_order` (`nomor_lhu`,`urutan_lhu`),
  ADD KEY `idx_detail_lhu_fpm` (`id_fppl_parameter_metode`);

ALTER TABLE `fppl`
  ADD PRIMARY KEY (`id_registrasi`),
  ADD UNIQUE KEY `uq_fppl_nomor` (`nomor_fppl`),
  ADD KEY `idx_fppl_pelanggan` (`id_pelanggan`),
  ADD KEY `idx_fppl_tarif_pengambilan` (`id_tarif_pengambilan`),
  ADD KEY `idx_fppl_diverifikasi_oleh` (`diverifikasi_oleh`);

ALTER TABLE `fppl_parameter_metode`
  ADD PRIMARY KEY (`id_fppl_parameter_metode`),
  ADD UNIQUE KEY `uq_fpm_fpplsampel_parameter` (`id_fppl_sampel`,`id_parameter`),
  ADD KEY `idx_fpm_parameter` (`id_parameter`),
  ADD KEY `idx_fpm_metode_parameter` (`id_metode_parameter`),
  ADD KEY `idx_fpm_dipilih_oleh` (`dipilih_oleh`),
  ADD KEY `fk_fpm_metode_parameter_pair` (`id_metode_parameter`,`id_parameter`);

ALTER TABLE `fppl_sampel`
  ADD PRIMARY KEY (`id_fppl_sampel`),
  ADD KEY `idx_fppl_sampel_registrasi` (`id_registrasi`),
  ADD KEY `idx_fppl_sampel_jenis` (`id_jenis_sampel`),
  ADD KEY `idx_fppl_sampel_regbm` (`id_reg_bm`);

ALTER TABLE `invoice`
  ADD PRIMARY KEY (`id_invoice`),
  ADD UNIQUE KEY `uq_invoice_registrasi` (`id_registrasi`);

ALTER TABLE `invoice_item`
  ADD PRIMARY KEY (`id_invoice`,`id_fppl_parameter_metode`),
  ADD KEY `idx_invoice_item_fpm` (`id_fppl_parameter_metode`);

ALTER TABLE `jadwal_pengambilan_lhu`
  ADD PRIMARY KEY (`id_jadwal_lhu`),
  ADD UNIQUE KEY `uq_jadwal_lhu_registrasi` (`id_registrasi`),
  ADD KEY `idx_jadwal_lhu_status` (`status_pengambilan`),
  ADD KEY `idx_jadwal_lhu_dijadwalkan_oleh` (`dijadwalkan_oleh`);

ALTER TABLE `jadwal_sampel`
  ADD PRIMARY KEY (`id_jadwal`),
  ADD KEY `idx_jadwal_registrasi` (`id_registrasi`),
  ADD KEY `idx_jadwal_pcc` (`id_pegawai_pcc`),
  ADD KEY `idx_jadwal_sampel_dibuat_oleh` (`dibuat_oleh`);

ALTER TABLE `jenis_sampel`
  ADD PRIMARY KEY (`id_jenis_sampel`),
  ADD UNIQUE KEY `uq_jenis_sampel_nama` (`jenis_sampel`);

ALTER TABLE `kategori_parameter`
  ADD PRIMARY KEY (`id_kategori_parameter`),
  ADD UNIQUE KEY `uq_kategori_parameter_nama` (`nama_kategori`);

ALTER TABLE `lhu`
  ADD PRIMARY KEY (`nomor_lhu`),
  ADD KEY `idx_lhu_pkt_bm` (`id_pkt_bm`),
  ADD KEY `idx_lhu_status_lhu` (`status_lhu`),
  ADD KEY `idx_lhu_qc_by` (`qc_by`),
  ADD KEY `idx_lhu_kalab_by` (`kalab_by`),
  ADD KEY `idx_lhu_id_registrasi` (`id_registrasi`);

ALTER TABLE `lhu_sampel`
  ADD PRIMARY KEY (`nomor_lhu`,`no_sampel`),
  ADD UNIQUE KEY `uq_lhu_sampel_no_sampel` (`no_sampel`),
  ADD KEY `idx_lhu_sampel_no_sampel` (`no_sampel`);

ALTER TABLE `lka`
  ADD PRIMARY KEY (`kode_lka`),
  ADD UNIQUE KEY `uq_lka_penugasan_detail` (`id_penugasan_detail`),
  ADD KEY `idx_lka_pelapor` (`dilaporkan_oleh`),
  ADD KEY `idx_lka_pemeriksa` (`diperiksa_oleh`);

ALTER TABLE `lka_hasil`
  ADD PRIMARY KEY (`kode_lka`,`no_sampel`),
  ADD KEY `idx_lka_hasil_sampel` (`no_sampel`),
  ADD KEY `idx_lka_hasil_status_review` (`status_review_hasil`);

ALTER TABLE `lka_revisi`
  ADD PRIMARY KEY (`id_revisi_lka`),
  ADD KEY `idx_lka_revisi_kode_lka` (`kode_lka`),
  ADD KEY `idx_lka_revisi_sumber_status` (`sumber_revisi`,`status_revisi`),
  ADD KEY `idx_lka_revisi_diajukan_oleh` (`diajukan_oleh`),
  ADD KEY `idx_lka_revisi_ditinjau_oleh` (`ditinjau_oleh`);

ALTER TABLE `lka_revisi_item`
  ADD PRIMARY KEY (`id_revisi_item`),
  ADD KEY `idx_lka_revisi_item_revisi` (`id_revisi_lka`),
  ADD KEY `idx_lka_revisi_item_hasil` (`kode_lka`,`no_sampel`);

ALTER TABLE `metode`
  ADD PRIMARY KEY (`id_metode`),
  ADD UNIQUE KEY `uq_metode_nama` (`nama_metode`);

ALTER TABLE `notifikasi_email`
  ADD PRIMARY KEY (`id_notifikasi_email`),
  ADD KEY `idx_notif_email_tipe` (`id_tipe_notifikasi`),
  ADD KEY `idx_notif_email_status` (`status_pengiriman`),
  ADD KEY `idx_notif_email_user` (`penerima_user_nik`),
  ADD KEY `idx_notif_email_pelanggan` (`penerima_pelanggan_id`),
  ADD KEY `idx_notif_email_registrasi` (`id_registrasi`),
  ADD KEY `idx_notif_email_jadwal_lhu` (`id_jadwal_lhu`),
  ADD KEY `idx_notif_email_lhu` (`nomor_lhu`),
  ADD KEY `idx_notif_email_penugasan` (`id_penugasan`),
  ADD KEY `idx_notif_email_dibuat_pada` (`dibuat_pada`);

ALTER TABLE `parameter`
  ADD PRIMARY KEY (`id_parameter`),
  ADD UNIQUE KEY `uq_parameter_nama` (`nama_parameter`),
  ADD KEY `idx_parameter_kategori` (`id_kategori_parameter`);

ALTER TABLE `parameter_metode`
  ADD PRIMARY KEY (`id_metode_parameter`),
  ADD UNIQUE KEY `uq_parameter_metode_idparam` (`id_metode_parameter`,`id_parameter`),
  ADD UNIQUE KEY `uq_parameter_metode_variant` (`id_parameter`,`id_metode`,`acuan_metode`,`is_subkontrak`),
  ADD KEY `idx_parameter_metode_parameter` (`id_parameter`),
  ADD KEY `idx_parameter_metode_metode` (`id_metode`);

ALTER TABLE `payment`
  ADD PRIMARY KEY (`id_payment`),
  ADD UNIQUE KEY `uq_payment_invoice` (`id_invoice`);

ALTER TABLE `pegawai`
  ADD PRIMARY KEY (`id_pegawai`),
  ADD UNIQUE KEY `uq_pegawai_nik` (`nik`);

ALTER TABLE `pelanggan`
  ADD PRIMARY KEY (`id_pelanggan`),
  ADD KEY `idx_pelanggan_nik` (`nik`);

ALTER TABLE `pengajuan_perubahan_jadwal`
  ADD PRIMARY KEY (`id_pengajuan_jadwal`),
  ADD KEY `idx_pengajuan_jadwal_registrasi` (`id_registrasi`),
  ADD KEY `idx_pengajuan_jadwal_status` (`status_pengajuan`),
  ADD KEY `idx_pengajuan_jadwal_jenis` (`jenis_jadwal`),
  ADD KEY `idx_pengajuan_jadwal_sampel` (`id_jadwal_sampel`),
  ADD KEY `idx_pengajuan_jadwal_lhu` (`id_jadwal_lhu`),
  ADD KEY `idx_pengajuan_jadwal_diajukan` (`diajukan_pada`);

ALTER TABLE `penugasan`
  ADD PRIMARY KEY (`id_penugasan`),
  ADD KEY `idx_penugasan_analis` (`id_user_analis`),
  ADD KEY `idx_penugasan_assigned_by` (`assigned_by`),
  ADD KEY `idx_penugasan_jenis` (`jenis_penugasan`);

ALTER TABLE `penugasan_detail`
  ADD PRIMARY KEY (`id_penugasan_detail`),
  ADD KEY `fk_penugasan_detail_metode_parameter` (`id_metode_parameter`),
  ADD KEY `idx_penugasan_detail_penugasan` (`id_penugasan`);

ALTER TABLE `penugasan_item`
  ADD PRIMARY KEY (`id_penugasan_detail`,`no_sampel`),
  ADD KEY `idx_penugasan_item_sampel` (`no_sampel`);

ALTER TABLE `pkt_bm`
  ADD PRIMARY KEY (`id_pkt_bm`),
  ADD KEY `idx_pkt_bm_reg` (`id_reg_bm`),
  ADD KEY `idx_pkt_bm_jenis` (`id_jenis_sampel`);

ALTER TABLE `pkt_bm_param`
  ADD PRIMARY KEY (`id_pkt_bm_param`),
  ADD UNIQUE KEY `uq_pkt_bm_param_pair` (`id_pkt_bm`,`id_parameter`),
  ADD KEY `idx_pkt_bm_param_parameter` (`id_parameter`);

ALTER TABLE `pkt_bm_pm`
  ADD PRIMARY KEY (`id_pkt_bm_param`,`id_metode_parameter`),
  ADD UNIQUE KEY `uq_pkt_bm_pm_pair` (`id_pkt_bm_param`,`id_metode_parameter`),
  ADD KEY `idx_pkt_bm_pm_metode` (`id_metode_parameter`);

ALTER TABLE `reg_bm`
  ADD PRIMARY KEY (`id_reg_bm`);

ALTER TABLE `role`
  ADD PRIMARY KEY (`id_role`),
  ADD UNIQUE KEY `uq_role_nama` (`nama_role`);

ALTER TABLE `sampel`
  ADD PRIMARY KEY (`no_sampel`),
  ADD KEY `idx_sampel_fppl_sampel` (`id_fppl_sampel`),
  ADD KEY `idx_sampel_diterima_oleh` (`diterima_oleh`);

ALTER TABLE `sampel_parameter`
  ADD PRIMARY KEY (`no_sampel`,`id_fppl_parameter_metode`),
  ADD KEY `idx_sampel_parameter_fpm` (`id_fppl_parameter_metode`);

ALTER TABLE `tarif_pengambilan`
  ADD PRIMARY KEY (`id_tarif_pengambilan`);

ALTER TABLE `tipe_notifikasi`
  ADD PRIMARY KEY (`id_tipe_notifikasi`);

ALTER TABLE `user`
  ADD PRIMARY KEY (`nik`),
  ADD UNIQUE KEY `uq_user_username` (`username`),
  ADD UNIQUE KEY `uq_user_email` (`email`),
  ADD KEY `idx_user_role` (`id_role`);

ALTER TABLE `user_refresh_session`
  ADD PRIMARY KEY (`id_refresh_session`),
  ADD UNIQUE KEY `uq_refresh_token_hash` (`refresh_token_hash`),
  ADD KEY `idx_refresh_session_nik` (`nik`),
  ADD KEY `idx_refresh_session_expires_at` (`refresh_token_expires_at`),
  ADD KEY `idx_refresh_session_revoked_at` (`revoked_at`);

ALTER TABLE `rekening_pembayaran`
  ADD PRIMARY KEY (`id_rekening`),
  ADD KEY `idx_rekening_is_active` (`is_active`),
  ADD KEY `idx_rekening_is_primary` (`is_primary`),
  ADD KEY `idx_rekening_created_by` (`created_by`),
  ADD KEY `idx_rekening_updated_by` (`updated_by`);

ALTER TABLE `aktivitas_sistem_log`
  ADD CONSTRAINT `fk_aktivitas_dibuat_oleh` FOREIGN KEY (`dibuat_oleh`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `detail_lhu`
  ADD CONSTRAINT `fk_detail_lhu_fpm` FOREIGN KEY (`id_fppl_parameter_metode`) REFERENCES `fppl_parameter_metode` (`id_fppl_parameter_metode`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_lhu_lhu` FOREIGN KEY (`nomor_lhu`) REFERENCES `lhu` (`nomor_lhu`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `fppl`
  ADD CONSTRAINT `fk_fppl_diverifikasi_oleh` FOREIGN KEY (`diverifikasi_oleh`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_fppl_pelanggan` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan` (`id_pelanggan`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_fppl_tarif_pengambilan` FOREIGN KEY (`id_tarif_pengambilan`) REFERENCES `tarif_pengambilan` (`id_tarif_pengambilan`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `fppl_parameter_metode`
  ADD CONSTRAINT `fk_fpm_dipilih_oleh` FOREIGN KEY (`dipilih_oleh`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_fpm_fppl_sampel` FOREIGN KEY (`id_fppl_sampel`) REFERENCES `fppl_sampel` (`id_fppl_sampel`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_fpm_metode_parameter_pair` FOREIGN KEY (`id_metode_parameter`,`id_parameter`) REFERENCES `parameter_metode` (`id_metode_parameter`, `id_parameter`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_fpm_parameter` FOREIGN KEY (`id_parameter`) REFERENCES `parameter` (`id_parameter`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `fppl_sampel`
  ADD CONSTRAINT `fk_fppl_sampel_fppl` FOREIGN KEY (`id_registrasi`) REFERENCES `fppl` (`id_registrasi`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_fppl_sampel_jenis_sampel` FOREIGN KEY (`id_jenis_sampel`) REFERENCES `jenis_sampel` (`id_jenis_sampel`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_fppl_sampel_reg_bm` FOREIGN KEY (`id_reg_bm`) REFERENCES `reg_bm` (`id_reg_bm`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `invoice`
  ADD CONSTRAINT `fk_invoice_fppl` FOREIGN KEY (`id_registrasi`) REFERENCES `fppl` (`id_registrasi`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `invoice_item`
  ADD CONSTRAINT `fk_invoice_item_fpm` FOREIGN KEY (`id_fppl_parameter_metode`) REFERENCES `fppl_parameter_metode` (`id_fppl_parameter_metode`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_invoice_item_invoice` FOREIGN KEY (`id_invoice`) REFERENCES `invoice` (`id_invoice`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `jadwal_pengambilan_lhu`
  ADD CONSTRAINT `fk_jadwal_lhu_dijadwalkan_oleh` FOREIGN KEY (`dijadwalkan_oleh`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jadwal_lhu_fppl` FOREIGN KEY (`id_registrasi`) REFERENCES `fppl` (`id_registrasi`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `jadwal_sampel`
  ADD CONSTRAINT `fk_jadwal_sampel_dibuat_oleh` FOREIGN KEY (`dibuat_oleh`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jadwal_sampel_fppl` FOREIGN KEY (`id_registrasi`) REFERENCES `fppl` (`id_registrasi`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jadwal_sampel_pcc` FOREIGN KEY (`id_pegawai_pcc`) REFERENCES `pegawai` (`id_pegawai`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `lhu`
  ADD CONSTRAINT `fk_lhu_fppl` FOREIGN KEY (`id_registrasi`) REFERENCES `fppl` (`id_registrasi`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lhu_kalab_by` FOREIGN KEY (`kalab_by`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lhu_pkt_bm` FOREIGN KEY (`id_pkt_bm`) REFERENCES `pkt_bm` (`id_pkt_bm`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lhu_qc_by` FOREIGN KEY (`qc_by`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `lhu_sampel`
  ADD CONSTRAINT `fk_lhu_sampel_lhu` FOREIGN KEY (`nomor_lhu`) REFERENCES `lhu` (`nomor_lhu`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lhu_sampel_sampel` FOREIGN KEY (`no_sampel`) REFERENCES `sampel` (`no_sampel`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `lka`
  ADD CONSTRAINT `fk_lka_dilaporkan_oleh` FOREIGN KEY (`dilaporkan_oleh`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lka_diperiksa_oleh` FOREIGN KEY (`diperiksa_oleh`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lka_penugasan_detail` FOREIGN KEY (`id_penugasan_detail`) REFERENCES `penugasan_detail` (`id_penugasan_detail`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lka_hasil`
  ADD CONSTRAINT `fk_lka_hasil_lka` FOREIGN KEY (`kode_lka`) REFERENCES `lka` (`kode_lka`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lka_hasil_sampel` FOREIGN KEY (`no_sampel`) REFERENCES `sampel` (`no_sampel`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lka_revisi`
  ADD CONSTRAINT `fk_lka_revisi_diajukan_oleh` FOREIGN KEY (`diajukan_oleh`) REFERENCES `user` (`nik`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lka_revisi_ditinjau_oleh` FOREIGN KEY (`ditinjau_oleh`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lka_revisi_lka` FOREIGN KEY (`kode_lka`) REFERENCES `lka` (`kode_lka`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lka_revisi_item`
  ADD CONSTRAINT `fk_lka_revisi_item_hasil` FOREIGN KEY (`kode_lka`,`no_sampel`) REFERENCES `lka_hasil` (`kode_lka`, `no_sampel`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lka_revisi_item_revisi` FOREIGN KEY (`id_revisi_lka`) REFERENCES `lka_revisi` (`id_revisi_lka`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `notifikasi_email`
  ADD CONSTRAINT `fk_notif_email_fppl` FOREIGN KEY (`id_registrasi`) REFERENCES `fppl` (`id_registrasi`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notif_email_jadwal_lhu` FOREIGN KEY (`id_jadwal_lhu`) REFERENCES `jadwal_pengambilan_lhu` (`id_jadwal_lhu`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notif_email_lhu` FOREIGN KEY (`nomor_lhu`) REFERENCES `lhu` (`nomor_lhu`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notif_email_pelanggan` FOREIGN KEY (`penerima_pelanggan_id`) REFERENCES `pelanggan` (`id_pelanggan`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notif_email_penugasan` FOREIGN KEY (`id_penugasan`) REFERENCES `penugasan` (`id_penugasan`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notif_email_tipe` FOREIGN KEY (`id_tipe_notifikasi`) REFERENCES `tipe_notifikasi` (`id_tipe_notifikasi`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notif_email_user` FOREIGN KEY (`penerima_user_nik`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `parameter`
  ADD CONSTRAINT `fk_parameter_kategori` FOREIGN KEY (`id_kategori_parameter`) REFERENCES `kategori_parameter` (`id_kategori_parameter`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `parameter_metode`
  ADD CONSTRAINT `fk_parameter_metode_metode` FOREIGN KEY (`id_metode`) REFERENCES `metode` (`id_metode`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_parameter_metode_parameter` FOREIGN KEY (`id_parameter`) REFERENCES `parameter` (`id_parameter`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `payment`
  ADD CONSTRAINT `fk_payment_invoice` FOREIGN KEY (`id_invoice`) REFERENCES `invoice` (`id_invoice`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pegawai`
  ADD CONSTRAINT `fk_pegawai_user_nik` FOREIGN KEY (`nik`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `pelanggan`
  ADD CONSTRAINT `fk_pelanggan_user_nik` FOREIGN KEY (`nik`) REFERENCES `user` (`nik`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pengajuan_perubahan_jadwal`
  ADD CONSTRAINT `fk_pengajuan_jadwal_fppl` FOREIGN KEY (`id_registrasi`) REFERENCES `fppl` (`id_registrasi`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengajuan_jadwal_lhu` FOREIGN KEY (`id_jadwal_lhu`) REFERENCES `jadwal_pengambilan_lhu` (`id_jadwal_lhu`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengajuan_jadwal_sampel` FOREIGN KEY (`id_jadwal_sampel`) REFERENCES `jadwal_sampel` (`id_jadwal`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `penugasan`
  ADD CONSTRAINT `fk_penugasan_analis` FOREIGN KEY (`id_user_analis`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_penugasan_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `penugasan_detail`
  ADD CONSTRAINT `fk_penugasan_detail_metode_parameter` FOREIGN KEY (`id_metode_parameter`) REFERENCES `parameter_metode` (`id_metode_parameter`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_penugasan_detail_penugasan` FOREIGN KEY (`id_penugasan`) REFERENCES `penugasan` (`id_penugasan`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `penugasan_item`
  ADD CONSTRAINT `fk_penugasan_item_detail` FOREIGN KEY (`id_penugasan_detail`) REFERENCES `penugasan_detail` (`id_penugasan_detail`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_penugasan_item_sampel` FOREIGN KEY (`no_sampel`) REFERENCES `sampel` (`no_sampel`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pkt_bm`
  ADD CONSTRAINT `fk_pkt_bm_jenis_sampel` FOREIGN KEY (`id_jenis_sampel`) REFERENCES `jenis_sampel` (`id_jenis_sampel`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pkt_bm_reg_bm` FOREIGN KEY (`id_reg_bm`) REFERENCES `reg_bm` (`id_reg_bm`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pkt_bm_param`
  ADD CONSTRAINT `fk_pkt_bm_param_parameter` FOREIGN KEY (`id_parameter`) REFERENCES `parameter` (`id_parameter`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pkt_bm_param_pkt_bm` FOREIGN KEY (`id_pkt_bm`) REFERENCES `pkt_bm` (`id_pkt_bm`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pkt_bm_pm`
  ADD CONSTRAINT `fk_pkt_bm_pm_metode_parameter` FOREIGN KEY (`id_metode_parameter`) REFERENCES `parameter_metode` (`id_metode_parameter`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pkt_bm_pm_param` FOREIGN KEY (`id_pkt_bm_param`) REFERENCES `pkt_bm_param` (`id_pkt_bm_param`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sampel`
  ADD CONSTRAINT `fk_sampel_diterima_oleh` FOREIGN KEY (`diterima_oleh`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sampel_fppl_sampel` FOREIGN KEY (`id_fppl_sampel`) REFERENCES `fppl_sampel` (`id_fppl_sampel`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sampel_parameter`
  ADD CONSTRAINT `fk_sampel_parameter_fpm` FOREIGN KEY (`id_fppl_parameter_metode`) REFERENCES `fppl_parameter_metode` (`id_fppl_parameter_metode`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sampel_parameter_sampel` FOREIGN KEY (`no_sampel`) REFERENCES `sampel` (`no_sampel`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user`
  ADD CONSTRAINT `fk_user_role` FOREIGN KEY (`id_role`) REFERENCES `role` (`id_role`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `user_refresh_session`
  ADD CONSTRAINT `fk_refresh_session_user_nik` FOREIGN KEY (`nik`) REFERENCES `user` (`nik`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rekening_pembayaran`
  ADD CONSTRAINT `fk_rekening_created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rekening_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `user` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
