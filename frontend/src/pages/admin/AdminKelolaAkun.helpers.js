// Urutan ini disamakan dengan STAFF_ROLE_ORDER di backend:
// Kepala Sub Bagian Tata Usaha -> PSP -> Kepala Lab -> Kasi -> QC -> Penyelia -> Analis -> PPS.
export const STAFF_ROLES = [
  'Kepala Sub Bagian Tata Usaha',
  'Pengelola Sampel Pengujian',
  'Kepala Lab',
  'Kasi Pengujian',
  'Pengendalian Mutu',
  'Penyelia',
  'Analis',
  'PPS',
];

export const STAFF_ROLE_SORT_ORDER = [
  'Kepala Sub Bagian Tata Usaha',
  'Pengelola Sampel Pengujian',
  'Kepala Lab',
  'Kasi Pengujian',
  'Pengendalian Mutu',
  'Penyelia',
  'Analis',
  'PPS',
  'Petugas',
];

export const STATUS_OPTIONS = ['Aktif', 'Nonaktif'];

export const EMPTY_STAFF_FORM = {
  nik: '',
  name: '',
  jabatan: '',
  isPcc: false,
  nip: '',
  email: '',
  phone: '',
  username: '',
  role: 'Analis',
  status: 'Aktif',
  passwordMode: 'generate',
  password: '',
  confirmPassword: '',
};

export function text(value) {
  return String(value ?? '').trim();
}

export function dash(value) {
  const clean = text(value);
  return clean || '-';
}

export function initials(name) {
  const parts = text(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function getStatus(row) {
  if (row?.status) return row.status;
  return Number(row?.isActive ?? row?.is_active ?? 1) === 1 ? 'Aktif' : 'Nonaktif';
}

export function getToggleValue(row) {
  return getStatus(row) === 'Aktif' ? 0 : 1;
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const clean = text(value);

    if (clean && clean !== 'Semua') {
      query.set(key, clean);
    }
  });

  const qs = query.toString();
  return qs ? `?${qs}` : '';
}


export function getStaffRoleOrderValue(row = {}) {
  const backendOrder = Number(row?.role_order ?? row?.roleOrder);
  if (Number.isFinite(backendOrder)) return backendOrder;

  const role = text(row?.role);
  if (Number(row?.is_pcc || 0) === 1 || ['PCC', 'PPS'].includes(role)) {
    return STAFF_ROLE_SORT_ORDER.indexOf('PPS');
  }

  const index = STAFF_ROLE_SORT_ORDER.indexOf(role);
  return index >= 0 ? index : STAFF_ROLE_SORT_ORDER.length;
}

export function sortStaffByBackendRoleOrder(rows = []) {
  return [...rows].sort((a, b) => {
    const roleDiff = getStaffRoleOrderValue(a) - getStaffRoleOrderValue(b);
    if (roleDiff !== 0) return roleDiff;

    return text(a?.nama_pegawai || a?.name || a?.username).localeCompare(
      text(b?.nama_pegawai || b?.name || b?.username),
      'id',
      { sensitivity: 'base' }
    );
  });
}
