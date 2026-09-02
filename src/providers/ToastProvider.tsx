import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastItem, ToastViewport } from '@/components/ui';
import type { ToastMessage, ToastVariant } from '@/components/ui';

type ToastInput = Omit<ToastMessage, 'id' | 'variant'> & { variant?: ToastVariant };

interface ToastContextValue {
  notify: (toast: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    ({ variant = 'info', ...rest }: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, variant, ...rest }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS));
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, description?: string) => notify({ title, variant: 'success', ...(description ? { description } : {}) }),
    [notify],
  );

  const error = useCallback(
    (title: string, description?: string) => notify({ title, variant: 'error', ...(description ? { description } : {}) }),
    [notify],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ notify, success, error, dismiss }),
    [notify, success, error, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  }
  return context;
}
