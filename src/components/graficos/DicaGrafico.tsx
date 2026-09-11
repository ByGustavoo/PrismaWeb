import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { ValorMonetario } from '@/components/comum';
import styles from './DicaGrafico.module.css';

type DicaGraficoProps = TooltipProps<ValueType, NameType> & {
  formatarValor?: (value: number) => string;
};

export function DicaGrafico({ active, payload, label, formatarValor }: DicaGraficoProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      {label ? <p className={styles.label}>{String(label)}</p> : null}
      <ul className={styles.list}>
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className={styles.item}>
            <span className={styles.marker} style={{ backgroundColor: entry.color }} aria-hidden="true" />
            <span className={styles.name}>{entry.name}</span>
            {formatarValor ? (
              <span className={`${styles.value} tabular`}>{formatarValor(Number(entry.value))}</span>
            ) : (
              <ValorMonetario className={styles.value} valor={Number(entry.value)} tamanho="sm" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
