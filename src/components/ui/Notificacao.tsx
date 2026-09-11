import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './Notificacao.module.css';

export type VarianteNotificacao = 'success' | 'error' | 'warning' | 'info';

export interface MensagemNotificacao {
  id: string;
  titulo: string;
  descricao?: string;
  variante: VarianteNotificacao;
}

const iconePorVariante: Record<VarianteNotificacao, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface ItemNotificacaoProps {
  notificacao: MensagemNotificacao;
  aoDispensar: (id: string) => void;
}

export function ItemNotificacao({ notificacao, aoDispensar }: ItemNotificacaoProps) {
  const Icon = iconePorVariante[notificacao.variante];

  return (
    <div className={juntarClasses(styles.toast, styles[notificacao.variante])} role="status">
      <Icon className={styles.icon} size={18} strokeWidth={2} aria-hidden="true" />
      <div className={styles.text}>
        <p className={styles.title}>{notificacao.titulo}</p>
        {notificacao.descricao ? <p className={styles.description}>{notificacao.descricao}</p> : null}
      </div>
      <button type="button" className={styles.close} onClick={() => aoDispensar(notificacao.id)} aria-label="Fechar aviso">
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

export function AreaNotificacoes({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.viewport} aria-live="polite" aria-relevant="additions">
      {children}
    </div>
  );
}
