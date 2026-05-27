const normalizeRoleText = (value = '') => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ');

export const ROLE_CODE_TO_KEY = {
  'RL-001': 'pelanggan',
  'RL-002': 'admin',
  'RL-003': 'kasi',
  'RL-004': 'penyelia',
  'RL-005': 'analis',
  'RL-006': 'qc',
  'RL-007': 'kalab',
  'RL-008': 'psp',
  1: 'pelanggan',
  2: 'admin',
  3: 'kasi',
  4: 'penyelia',
  5: 'analis',
  6: 'qc',
  7: 'kalab',
  8: 'psp',
};

export const ROLE_NAME_TO_KEY = {
  pelanggan: 'pelanggan',
  customer: 'pelanggan',
  admin: 'admin',
  'kepala sub bagian tata usaha': 'admin',
  'kepala subbagian tata usaha': 'admin',
  'kepala sub bagian bidang usaha': 'admin',
  'kepala subbagian bidang usaha': 'admin',
  'kasi pengujian': 'kasi',
  kasi: 'kasi',
  penyelia: 'penyelia',
  analis: 'analis',
  qc: 'qc',
  'pengendalian mutu': 'qc',
  'kepala laboratorium': 'kalab',
  kalab: 'kalab',
  psp: 'psp',
  'pengelola sampel pengujian': 'psp',
};

export function resolveUserRole(user = {}) {
  const roleCode = user.idRole || user.id_role || user.kodeRole || user.kode_role;
  if (ROLE_CODE_TO_KEY[roleCode]) return ROLE_CODE_TO_KEY[roleCode];

  const roleName = normalizeRoleText(
    user.roleKey ||
      user.role_key ||
      user.role ||
      user.namaRole ||
      user.nama_role ||
      user.jabatan ||
      ''
  );

  return ROLE_NAME_TO_KEY[roleName] || 'pelanggan';
}

export function resolveUserDisplayName(user = {}) {
  return (
    user.username ||
    user.namaUser ||
    user.nama_user ||
    user.pic ||
    user.email?.split('@')[0] ||
    'User'
  );
}
