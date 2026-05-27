import {
  Beaker,
  CheckCircle,
  Clipboard,
  ClipboardCheck,
  Clock,
  FileCheck,
  FileText,
  FlaskRound,
  Home,
  Landmark,
  Users,
} from 'lucide-react';
import uptdLogo from '../assets/logo-uptd.png';


const PAGE_ALIASES = {
  global: {
    detail_sampel: 'detail_sampel',
    'detail-sampel': 'detail_sampel',
    detail_penugasan: 'detail-penugasan',
    kelola_parameter: 'kelola-parameter',
    kelola_akun: 'kelola-akun',
    kelola_rekening: 'kelola-rekening',
    rekening: 'kelola-rekening',
    'rekening-pembayaran': 'kelola-rekening',
    payment_accounts: 'kelola-rekening',
    'payment-accounts': 'kelola-rekening',
  },
};

export const ROLE_PAGE_CONFIG = {
  pelanggan: {
    portalTitle: 'SILABLING',
    portalSubtitle: 'Pelanggan',
    portalLogo: uptdLogo,
    roleLabel: 'Pelanggan',
    defaultPage: 'dashboard',
    pages: {
      dashboard: { title: 'Dashboard', menuLabel: 'Dashboard', icon: Home },
      register: { title: 'Daftar Pengujian', menuLabel: 'Daftar Pengujian', icon: FileText },
      status: { title: 'Status & Riwayat', menuLabel: 'Status & Riwayat Sampel', icon: Clock },
    },
    menu: ['dashboard', 'register', 'status'],
  },
  admin: {
    portalTitle: 'SILABLING',
    portalSubtitle: 'Kepala Sub Bagian Tata Usaha',
    portalLogo: uptdLogo,
    roleLabel: 'Kepala Sub Bagian Tata Usaha',
    defaultPage: 'dashboard',
    pages: {
      dashboard: { title: 'Dashboard', menuLabel: 'Dashboard', icon: Home },
      permohonan: { title: 'Permohonan Uji', menuLabel: 'Permohonan Uji', icon: FileCheck },
      'kelola-parameter': { title: 'Kelola Parameter', menuLabel: 'Kelola Parameter', icon: Beaker },
      'kelola-akun': { title: 'Kelola Akun', menuLabel: 'Kelola Akun', icon: Users },
      'kelola-rekening': { title: 'Kelola Nomor Rekening', menuLabel: 'Kelola Rekening', icon: Landmark },
    },
    menu: ['dashboard', 'permohonan', 'kelola-rekening', 'kelola-parameter', 'kelola-akun'],
  },
  psp: {
    portalTitle: 'SILABLING',
    portalSubtitle: 'Pengelola Sampel Pengujian',
    portalLogo: uptdLogo,
    roleLabel: 'Pengelola Sampel Pengujian',
    defaultPage: 'dashboard',
    pages: {
      dashboard: { title: 'Dashboard', menuLabel: 'Dashboard', icon: Home },
      permohonan: { title: 'Permohonan Uji', menuLabel: 'Permohonan Uji', icon: FileCheck },
    },
    menu: ['dashboard', 'permohonan'],
  },
  kasi: {
    portalTitle: 'SILABLING',
    portalSubtitle: 'Kasi Pengujian',
    portalLogo: uptdLogo,
    roleLabel: 'Kasi Pengujian',
    defaultPage: 'dashboard',
    pages: {
      dashboard: { title: 'Dashboard', menuLabel: 'Dashboard', icon: Home },
      permohonan: { title: 'Permohonan Pengujian', menuLabel: 'Permohonan Pengujian', icon: FileCheck },
      lhu: { title: 'LHU Sementara', menuLabel: 'LHU Sementara', icon: ClipboardCheck },
    },
    menu: ['dashboard', 'permohonan', 'lhu'],
  },
  penyelia: {
    portalTitle: 'SILABLING',
    portalSubtitle: 'Penyelia',
    portalLogo: uptdLogo,
    roleLabel: 'Penyelia',
    defaultPage: 'pengujian',
    pages: {
      pengujian: { title: 'Pengujian Sampel', menuLabel: 'Pengujian Sampel', icon: FlaskRound },
      penugasan: { title: 'Penugasan', menuLabel: 'Penugasan', icon: Users },
      'detail-penugasan': { title: 'Detail Penugasan', parent: 'penugasan' },
    },
    menu: ['pengujian', 'penugasan'],
  },
  analis: {
    portalTitle: 'SILABLING',
    portalSubtitle: 'Analis',
    portalLogo: uptdLogo,
    roleLabel: 'Analis',
    defaultPage: 'sampel',
    pages: {
      sampel: { title: 'Daftar Sampel', menuLabel: 'Daftar Sampel yang Ditugaskan', icon: Clipboard },
      detail_sampel: { title: 'Detail Sampel', parent: 'sampel' },
    },
    menu: ['sampel'],
  },
  qc: {
    portalTitle: 'SILABLING',
    portalSubtitle: 'Pengendalian Mutu',
    portalLogo: uptdLogo,
    roleLabel: 'Pengendalian Mutu',
    defaultPage: 'verifikasi',
    pages: {
      verifikasi: { title: 'Verifikasi Hasil Uji', menuLabel: 'Verifikasi Hasil Uji', icon: CheckCircle },
    },
    menu: ['verifikasi'],
  },
  kalab: {
    portalTitle: 'SILABLING',
    portalSubtitle: 'Kepala Laboratorium',
    portalLogo: uptdLogo,
    roleLabel: 'Kepala Laboratorium',
    defaultPage: 'lhu',
    pages: {
      lhu: { title: 'Lihat LHU', menuLabel: 'Lihat LHU', icon: FileText },
    },
    menu: ['lhu'],
  },
};

export function getRolePageConfig(role) {
  return ROLE_PAGE_CONFIG[role] || ROLE_PAGE_CONFIG.pelanggan;
}

export function getDefaultPageForRole(role) {
  return getRolePageConfig(role).defaultPage || 'dashboard';
}

export function getRoleLabel(role) {
  return getRolePageConfig(role).roleLabel || 'User';
}

export function getRolePortalConfig(role) {
  const config = getRolePageConfig(role);
  return {
    portalTitle: config.portalTitle,
    portalSubtitle: config.portalSubtitle,
    portalLogo: config.portalLogo,
  };
}

export function getRoleMenuItems(role) {
  const config = getRolePageConfig(role);

  return config.menu
    .map((pageId) => ({ id: pageId, ...config.pages[pageId] }))
    .filter((item) => item.id && item.icon && item.menuLabel);
}

export function getActiveMenuPage(role, page) {
  const pageConfig = getRolePageConfig(role).pages[page];
  return pageConfig?.parent || page;
}

export function getPageTitle(role, page) {
  return getRolePageConfig(role).pages[page]?.title || 'Halaman tidak ditemukan';
}

export function isPageAllowedForRole(role, page) {
  return Boolean(getRolePageConfig(role).pages[page]);
}


export function normalizePageForRole(role, page) {
  const rawPage = String(page || '').trim();
  const aliasedPage = PAGE_ALIASES[role]?.[rawPage] || PAGE_ALIASES.global[rawPage] || rawPage;

  if (isPageAllowedForRole(role, aliasedPage)) return aliasedPage;

  if (aliasedPage === 'dashboard') {
    return getDefaultPageForRole(role);
  }

  return rawPage;
}
