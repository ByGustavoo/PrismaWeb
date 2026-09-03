import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import styles from './SummaryBar.module.css';

export interface SummaryItem {
  label: string;
  /** Ja pronto para a tela: um `Amount`, uma contagem, um texto curto. */
  value: ReactNode;
  hint?: string;
}

export interface SummaryBarProps {
  items: SummaryItem[];
  className?: string;
}

/**
 * Faixa de numeros no topo de uma tela de cadastro. E uma alternativa
 * deliberada a uma fileira de cards: tres ou quatro figuras que respondem "como
 * estou" nao precisam de uma moldura cada uma, e uma tela que abre com quatro
 * caixas antes da lista empurra o conteudo de verdade para baixo da dobra.
 */
export function SummaryBar({ items, className }: SummaryBarProps) {
  return (
    <dl className={cn(styles.bar, className)}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
          {item.hint ? <dd className={styles.hint}>{item.hint}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
