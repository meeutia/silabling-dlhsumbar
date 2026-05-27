async function up({ connection }) {
  await connection.query(
    'INSERT INTO `role` (`id_role`, `nama_role`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `nama_role` = VALUES(`nama_role`)',
    ['RL-008', 'Pengelola Sampel Pengujian']
  );
}

module.exports = { up };
