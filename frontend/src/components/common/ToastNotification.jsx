import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { getToastConfig, getToastTitle, normalizeToastType } from '../../utils/toastConfig';

const POSITION_CLASS = {
  top: 'top-20 right-4 left-4 sm:left-auto sm:right-5',
  bottom: 'bottom-4 right-4 left-4 sm:left-auto sm:right-5',
  modalTop: 'top-[calc(5vh+0.75rem)] left-1/2 right-auto -translate-x-1/2',
  parameterModalTop: 'top-[calc(5vh+0.75rem)] left-1/2 right-auto -translate-x-1/2',
  inline: 'relative',
};

const POSITION_WIDTH_CLASS = {
  top: 'w-auto max-w-md',
  bottom: 'w-auto max-w-md',
  modalTop: 'w-[calc(100%-2rem)] max-w-3xl',
  parameterModalTop: 'w-[calc(100%-2rem)] max-w-3xl',
  inline: 'w-full',
};

const TOAST_STYLE = {
  success: {
    icon: CheckCircle2,
    compactClass: 'bg-gray-900 text-white',
    borderClass: 'border-emerald-200 bg-emerald-50',
    iconClass: 'text-emerald-600',
    titleClass: 'text-emerald-800',
    messageClass: 'text-emerald-700',
  },
  error: {
    icon: AlertCircle,
    compactClass: 'bg-red-600 text-white',
    borderClass: 'border-red-200 bg-red-50',
    iconClass: 'text-red-600',
    titleClass: 'text-red-800',
    messageClass: 'text-red-700',
  },
  warning: {
    icon: TriangleAlert,
    compactClass: 'bg-amber-600 text-white',
    borderClass: 'border-amber-200 bg-amber-50',
    iconClass: 'text-amber-600',
    titleClass: 'text-amber-800',
    messageClass: 'text-amber-700',
  },
  info: {
    icon: Info,
    compactClass: 'bg-blue-600 text-white',
    borderClass: 'border-blue-200 bg-blue-50',
    iconClass: 'text-blue-600',
    titleClass: 'text-blue-800',
    messageClass: 'text-blue-700',
  },
};

export function ToastNotification({
  toast,
  onClose,
  position,
  compact = false,
}) {
  const isOpen = Boolean(toast?.show ?? toast);
  if (!isOpen) return null;

  const type = normalizeToastType(toast?.type || 'success');
  const config = getToastConfig(type);
  const style = TOAST_STYLE[type] || TOAST_STYLE.success;
  const title = getToastTitle(type, toast?.title);
  const message = toast?.message || '';
  const Icon = style.icon;
  const resolvedPosition = position || toast?.position || config.position;
  const containerClass = POSITION_CLASS[resolvedPosition] || POSITION_CLASS.top;
  const widthClass = POSITION_WIDTH_CLASS[resolvedPosition] || POSITION_WIDTH_CLASS.top;

  if (compact) {
    return (
      <div
        className={`${resolvedPosition === 'inline' ? 'relative' : 'fixed'} ${containerClass} z-[9999] flex items-center gap-3 rounded-xl px-6 py-3 shadow-lg ${widthClass} ${style.compactClass}`}
        role="status"
      >
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{message || title}</span>
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Tutup notifikasi">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${resolvedPosition === 'inline' ? 'relative' : 'fixed'} ${containerClass} z-[9999] ${widthClass}`} role="status">
      <div className={`rounded-xl border p-4 shadow-xl ${style.borderClass}`}>
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />

          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${style.titleClass}`}>
              {title}
            </p>
            {message ? (
              <p className={`mt-1 text-sm ${style.messageClass}`}>
                {message}
              </p>
            ) : null}

            {toast?.temporaryPassword ? (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3">
                <p className="mb-1 text-xs text-gray-500">Password sementara</p>
                <code className="break-all text-sm font-semibold text-gray-900">
                  {toast.temporaryPassword}
                </code>
              </div>
            ) : null}
          </div>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-gray-500 hover:bg-white/70"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ToastNotification;
