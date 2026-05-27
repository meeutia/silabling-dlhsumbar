import { getToastDuration, getToastTitle, normalizeToastType } from './toastConfig';

const TOAST_EVENT_NAME = 'app:toast';

function emitToast(detail) {
  if (typeof window === 'undefined') return;

  const type = normalizeToastType(detail?.type || 'success');

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT_NAME, {
      detail: {
        id: detail?.id || Date.now(),
        type,
        title: getToastTitle(type, detail?.title),
        message: detail?.message || '',
        temporaryPassword: detail?.temporaryPassword,
        duration: getToastDuration(type, detail?.duration),
        position: detail?.position,
      },
    })
  );
}

export function showToast(detail) {
  emitToast(detail || {});
}

export function showSuccess(message, options = {}) {
  emitToast({
    type: 'success',
    title: options.title,
    message,
    ...options,
  });
}

export function showError(message, options = {}) {
  emitToast({
    type: 'error',
    title: options.title,
    message,
    ...options,
  });
}

export function showInfo(message, options = {}) {
  emitToast({
    type: 'info',
    title: options.title,
    message,
    ...options,
  });
}

export function showWarning(message, options = {}) {
  emitToast({
    type: 'warning',
    title: options.title,
    message,
    ...options,
  });
}

export function getToastEventName() {
  return TOAST_EVENT_NAME;
}
