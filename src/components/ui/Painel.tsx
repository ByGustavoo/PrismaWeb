import type { HTMLAttributes, ReactNode } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './Painel.module.css';

export interface PainelProps extends HTMLAttributes<HTMLDivElement> {
  tom?: 'default' | 'muted' | 'bare';
  espacamento?: 'none' | 'sm' | 'md';
}

export function Painel({ tom = 'default', espacamento = 'md', className, children, ...rest }: PainelProps) {
  return (
    <div className={juntarClasses(styles.card, styles[tom], styles[`padding-${espacamento}`], className)} {...rest}>
      {children}
    </div>
  );
}

export interface CabecalhoPainelProps {
  titulo: ReactNode;
  descricao?: ReactNode;
  acao?: ReactNode;
}

export function CabecalhoPainel({ titulo, descricao, acao }: CabecalhoPainelProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        <h2 className={styles.title}>{titulo}</h2>
        {descricao ? <p className={styles.description}>{descricao}</p> : null}
      </div>
      {acao ? <div className={styles.action}>{acao}</div> : null}
    </header>
  );
}

export function CorpoPainel({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={juntarClasses(styles.body, className)} {...rest}>
      {children}
    </div>
  );
}
