import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Amount } from '@/components/common';
import styles from './ChartTooltip.module.css';

type ChartTooltipProps = TooltipProps<ValueType, NameType> & {
  /** So para series que nao sao dinheiro; sem ele o valor sai como moeda. */
  formatValue?: (value: number) => string;
};

export function ChartTooltip({ active, payload, label, formatValue }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      {label ? <p className={styles.label}>{String(label)}</p> : null}
      <ul className={styles.list}>
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className={styles.item}>
            <span className={styles.marker} style={{ backgroundColor: entry.color }} aria-hidden="true" />
            <span className={styles.name}>{entry.name}</span>
            {formatValue ? (
              <span className={`${styles.value} tabular`}>{formatValue(Number(entry.value))}</span>
            ) : (
              <Amount className={styles.value} value={Number(entry.value)} size="sm" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
