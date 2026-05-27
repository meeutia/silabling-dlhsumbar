export const TOAST_TYPE_CONFIG = {
  success: {
    title: 'Berhasil',
    duration: 2600,
    position: 'top',
  },
  error: {
    title: 'Gagal',
    duration: 5200,
    position: 'top',
  },
  warning: {
    title: 'Perlu dicek',
    duration: 4200,
    position: 'top',
  },
  info: {
    title: 'Informasi',
    duration: 3400,
    position: 'top',
  },
};

export const DEFAULT_TOAST_TYPE = 'success';

export function normalizeToastType(type) {
  return TOAST_TYPE_CONFIG[type] ? type : DEFAULT_TOAST_TYPE;
}

export function getToastConfig(type) {
  return TOAST_TYPE_CONFIG[normalizeToastType(type)];
}

export function getToastTitle(type, customTitle) {
  return customTitle || getToastConfig(type).title;
}

export function getToastDuration(type, customDuration) {
  return customDuration ?? getToastConfig(type).duration;
}

export function getToastPosition(type, customPosition) {
  return customPosition || getToastConfig(type).position;
}
