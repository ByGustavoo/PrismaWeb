import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CreditCard, Receipt, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Amount } from '@/components/common';
import { EmptyState, Spinner } from '@/components/ui';
import { alertsService } from '@/services';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { Alert, AlertKind, AlertSeverity } from '@/types';
import { cn } from '@/utils/cn';
import { formatShortDate } from '@/utils/format';
import styles from './NotificationsPanel.module.css';

const kindIcon: Record<AlertKind, LucideIcon> = {
  'invoice-due': Receipt,
  'bill-due': TriangleAlert,
  scheduled: CalendarClock,
  'card-limit': CreditCard,
};

const severityClass: Record<AlertSeverity, string> = {
  critical: 'critical',
  attention: 'attention',
  info: 'info',
};

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  /** Recebe a contagem para o ponto do sino sempre que a lista muda. */
  onCountChange: (count: number) => void;
}

/**
 * Painel de avisos do header. A lista vem de `alertsService`, que hoje deriva os
 * avisos dos mocks (faturas a vencer, contas pendentes, agendamentos e cartoes
 * perto do limite) e amanha vem do backend sem que este componente mude.
 */
export function NotificationsPanel({ open, onClose, onCountChange }: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = useCallback((signal: AbortSignal) => alertsService.list(signal), []);
  const { data, loading, error } = useAsyncData(fetchAlerts);

  const alerts = data ?? [];
  const urgentCount = alerts.filter((alert) => alert.severity !== 'info').length;

  useEffect(() => {
    onCountChange(urgentCount);
  }, [urgentCount, onCountChange]);

  // Fecha ao clicar fora. O gatilho no header trata o proprio clique.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.('[data-notifications-trigger]')) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Avisos">
      <header className={styles.header}>
        <h2 className={styles.title}>Avisos</h2>
        {alerts.length > 0 ? (
          <span className={styles.count}>
            {alerts.length} {alerts.length === 1 ? 'aviso' : 'avisos'}
          </span>
        ) : null}
      </header>

      {loading ? (
        <div className={styles.state}>
          <Spinner />
        </div>
      ) : error ? (
        <div className={styles.state}>
          <EmptyState title="Não foi possível carregar os avisos" description={error.message} />
        </div>
      ) : alerts.length === 0 ? (
        <div className={styles.state}>
          <EmptyState title="Nenhum aviso" description="Nada exige sua atenção no momento." />
        </div>
      ) : (
        <ul className={styles.list}>
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onNavigate={onClose} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AlertRow({ alert, onNavigate }: { alert: Alert; onNavigate: () => void }) {
  const Icon = kindIcon[alert.kind];

  const content = (
    <>
      <span className={cn(styles.icon, styles[severityClass[alert.severity]])} aria-hidden="true">
        <Icon size={15} strokeWidth={2} />
      </span>

      <span className={styles.text}>
        <span className={styles.alertTitle}>{alert.title}</span>
        <span className={styles.description}>{alert.description}</span>
      </span>

      <span className={styles.meta}>
        {alert.amount === undefined ? null : <Amount value={alert.amount} size="sm" tone="muted" />}
        <span className={cn(styles.date, 'tabular')}>{formatShortDate(alert.date)}</span>
      </span>
    </>
  );

  return (
    <li>
      {alert.to ? (
        <Link className={styles.item} to={alert.to} onClick={onNavigate}>
          {content}
        </Link>
      ) : (
        <div className={styles.item}>{content}</div>
      )}
    </li>
  );
}
