import { useEffect, useState } from 'react';
import { getToastEventName } from '../../utils/feedback';
import { getToastDuration, normalizeToastType } from '../../utils/toastConfig';
import { ToastNotification } from './ToastNotification';

export function AppToastHost() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleToast = (event) => {
      const detail = event.detail || {};
      const type = normalizeToastType(detail.type || 'success');

      const nextToast = {
        show: true,
        type,
        title: detail.title,
        message: detail.message || '',
        temporaryPassword: detail.temporaryPassword,
        duration: getToastDuration(type, detail.duration),
        position: detail.position,
        id: detail.id || Date.now(),
      };

      setToast(nextToast);
    };

    window.addEventListener(getToastEventName(), handleToast);
    return () => window.removeEventListener(getToastEventName(), handleToast);
  }, []);

  useEffect(() => {
    if (!toast?.show) return undefined;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, toast.duration);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastNotification
      toast={toast}
      position={toast?.position}
      onClose={() => setToast(null)}
    />
  );
}

export default AppToastHost;
