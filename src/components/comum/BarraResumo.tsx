import type { ReactNode } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './BarraResumo.module.css';

export interface ItemResumo {
  rotulo: string;
  valor: ReactNode;
  variacao?: ReactNode;
  dica?: ReactNode;
}

export interface BarraResumoProps {
  itens: ItemResumo[];
}

export function BarraResumo({ itens }: BarraResumoProps) {
  return (
    <dl className={styles.bar}>
      {itens.map((item) => (
        <div key={item.rotulo} className={juntarClasses(styles.item, item.variacao ? styles.itemWithDelta : undefined)}>
          <dt className={styles.label}>{item.rotulo}</dt>
          <dd className={styles.value}>{item.valor}</dd>
          {item.variacao ? <dd className={styles.delta}>{item.variacao}</dd> : null}
          {item.dica ? <dd className={styles.hint}>{item.dica}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
