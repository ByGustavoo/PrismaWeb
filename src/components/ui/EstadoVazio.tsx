import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import styles from './EstadoVazio.module.css';

export interface EstadoVazioProps {
  icone?: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

export function EstadoVazio({ icone: Icon = Inbox, titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.iconBox} aria-hidden="true">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <h3 className={styles.title}>{titulo}</h3>
      {descricao ? <p className={styles.description}>{descricao}</p> : null}
      {acao ? <div className={styles.action}>{acao}</div> : null}
    </div>
  );
}
