import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import styles from './SummaryBar.module.css';

export interface SummaryItem {
  label: string;
  value: ReactNode;
  hint?: string;
}

export interface SummaryBarProps {
  items: SummaryItem[];
  className?: string;
}

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
