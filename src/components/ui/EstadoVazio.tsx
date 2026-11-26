import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import styles from './EstadoVazio.module.css';

export interface EstadoVazioProps {
  icone?: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  nivelTitulo?: 1 | 3;
}

export function EstadoVazio({ icone: Icon = Inbox, titulo, descricao, acao, nivelTitulo = 3 }: EstadoVazioProps) {
  const Titulo = nivelTitulo === 1 ? 'h1' : 'h3';

  return (
    <div className={styles.empty}>
      <span className={styles.iconBox} aria-hidden="true">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <Titulo className={styles.title}>{titulo}</Titulo>
      {descricao ? <p className={styles.description}>{descricao}</p> : null}
      {acao ? <div className={styles.action}>{acao}</div> : null}
    </div>
  );
}
