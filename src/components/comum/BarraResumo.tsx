import type { ReactNode } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './BarraResumo.module.css';

export interface ItemResumo {
  rotulo: string;
  valor: ReactNode;
  dica?: string;
}

export interface BarraResumoProps {
  itens: ItemResumo[];
  className?: string;
}

export function BarraResumo({ itens, className }: BarraResumoProps) {
  return (
    <dl className={juntarClasses(styles.bar, className)}>
      {itens.map((item) => (
        <div key={item.rotulo} className={styles.item}>
          <dt className={styles.label}>{item.rotulo}</dt>
          <dd className={styles.value}>{item.valor}</dd>
          {item.dica ? <dd className={styles.hint}>{item.dica}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
