import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import styles from './Toast.module.css';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

const iconByVariant: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = iconByVariant[toast.variant];

  return (
    <div className={cn(styles.toast, styles[toast.variant])} role="status">
      <Icon className={styles.icon} size={18} strokeWidth={2} aria-hidden="true" />
      <div className={styles.text}>
        <p className={styles.title}>{toast.title}</p>
        {toast.description ? <p className={styles.description}>{toast.description}</p> : null}
      </div>
      <button type="button" className={styles.close} onClick={() => onDismiss(toast.id)} aria-label="Fechar aviso">
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

export function ToastViewport({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.viewport} aria-live="polite" aria-relevant="additions">
      {children}
    </div>
  );
}
