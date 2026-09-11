import type { ReactNode } from 'react';
import styles from './CabecalhoPagina.module.css';

export interface CabecalhoPaginaProps {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}

export function CabecalhoPagina({ titulo, descricao, acoes }: CabecalhoPaginaProps) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.text}>
        <h1 className={styles.title}>{titulo}</h1>
        {descricao ? <p className={styles.description}>{descricao}</p> : null}
      </div>
      {acoes ? <div className={styles.actions}>{acoes}</div> : null}
    </div>
  );
}
