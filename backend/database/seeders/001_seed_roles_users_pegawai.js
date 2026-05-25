const bcrypt = require('bcryptjs');

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'Silabling@2026';

const roles = [
  ['RL-001', 'Pelanggan'],
  ['RL-002', 'Admin'],
  ['RL-003', 'Kasi Pengujian'],
  ['RL-004', 'Penyelia'],
  ['RL-005', 'Analis'],
  ['RL-006', 'Kasi Pengendalian Mutu'],
  ['RL-007', 'Kepala Laboratorium'],
];

const users = [
  { nik: '3171075704040002', id_role: 'RL-002', username: 'admin', email: 'admin@silabling.local' },
  { nik: '3171075704040009', id_role: 'RL-003', username: 'kasi', email: 'kasi@silabling.local' },
  { nik: '3171075704040004', id_role: 'RL-004', username: 'penyelia', email: 'penyelia@silabling.local' },
  { nik: '3171075704040005', id_role: 'RL-005', username: 'analis', email: 'analis@silabling.local' },
  { nik: '3121311314157590', id_role: 'RL-006', username: 'qc', email: 'qc@silabling.local' },
  { nik: '3171075704040001', id_role: 'RL-007', username: 'kalab', email: 'kalab@silabling.local' },
];

const pegawai = [
  { id_pegawai: 'PGW-001', nik: '3171075704040002', nip: '197001010000000001', nama_pegawai: 'Admin Lab', jabatan: 'Pengelola Sampel Pengujian', no_wa: '080000000001', is_pcc: 0 },
  { id_pegawai: 'PGW-002', nik: '3171075704040009', nip: '197001010000000002', nama_pegawai: 'Kasi Pengujian', jabatan: 'Kasi Pengujian', no_wa: '080000000002', is_pcc: 0 },
  { id_pegawai: 'PGW-003', nik: '3171075704040004', nip: '197001010000000003', nama_pegawai: 'Penyelia Lab', jabatan: 'Penyelia', no_wa: '080000000003', is_pcc: 0 },
  { id_pegawai: 'PGW-004', nik: '3171075704040005', nip: '197001010000000004', nama_pegawai: 'Analis Lab', jabatan: 'Analis', no_wa: '080000000004', is_pcc: 0 },
  { id_pegawai: 'PGW-005', nik: '3121311314157590', nip: '197001010000000005', nama_pegawai: 'Pengendalian Mutu', jabatan: 'Kasi Pengendalian Mutu', no_wa: '080000000005', is_pcc: 0 },
  { id_pegawai: 'PGW-006', nik: '3171075704040001', nip: '197001010000000006', nama_pegawai: 'Kepala Laboratorium', jabatan: 'Kepala Laboratorium', no_wa: '080000000006', is_pcc: 0 },
  { id_pegawai: 'PGW-007', nik: null, nip: '197001010000000007', nama_pegawai: 'Dr. Ahmad', jabatan: 'Kepala Sub Bagian Tata Usaha', no_wa: '080000000007', is_pcc: 0 },
  { id_pegawai: 'PGW-008', nik: null, nip: null, nama_pegawai: 'Pak Tomi PPS', jabatan: 'PCC', no_wa: '080000000008', is_pcc: 1 },
];

async function up({ connection }) {
  for (const [id, name] of roles) {
    await connection.query(
      'INSERT INTO `role` (`id_role`, `nama_role`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `nama_role` = VALUES(`nama_role`)',
      [id, name]
    );
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  for (const user of users) {
    await connection.query(
      `INSERT INTO \`user\`
       (\`nik\`, \`id_role\`, \`username\`, \`email\`, \`password\`, \`created_at\`, \`is_active\`)
       VALUES (?, ?, ?, ?, ?, NOW(), 1)
       ON DUPLICATE KEY UPDATE
         \`id_role\` = VALUES(\`id_role\`),
         \`username\` = VALUES(\`username\`),
         \`email\` = VALUES(\`email\`),
         \`is_active\` = 1`,
      [user.nik, user.id_role, user.username, user.email, passwordHash]
    );
  }

  for (const row of pegawai) {
    await connection.query(
      `INSERT INTO \`pegawai\`
       (\`id_pegawai\`, \`nik\`, \`nip\`, \`nama_pegawai\`, \`jabatan\`, \`no_wa\`, \`is_pcc\`)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         \`nik\` = VALUES(\`nik\`),
         \`nip\` = VALUES(\`nip\`),
         \`nama_pegawai\` = VALUES(\`nama_pegawai\`),
         \`jabatan\` = VALUES(\`jabatan\`),
         \`no_wa\` = VALUES(\`no_wa\`),
         \`is_pcc\` = VALUES(\`is_pcc\`)`,
      [row.id_pegawai, row.nik, row.nip, row.nama_pegawai, row.jabatan, row.no_wa, row.is_pcc]
    );
  }

  console.log(`Akun awal dibuat. Password default: ${DEFAULT_PASSWORD}`);
}

module.exports = { up };
