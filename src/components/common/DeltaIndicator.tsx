import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { Delta } from '@/types';
import { cn } from '@/utils/cn';
import { formatSignedPercent } from '@/utils/format';
import styles from './DeltaIndicator.module.css';

export interface DeltaIndicatorProps {
  delta: Delta;
  /** Em despesas, subir e ruim: inverte a cor sem inverter a seta. */
  invertColors?: boolean;
  caption?: string;
}

export function DeltaIndicator({ delta, invertColors = false, caption }: DeltaIndicatorProps) {
  const Icon = delta.trend === 'up' ? ArrowUpRight : delta.trend === 'down' ? ArrowDownRight : Minus;
  const good = invertColors ? delta.trend === 'down' : delta.trend === 'up';
  const tone = delta.trend === 'flat' ? 'flat' : good ? 'good' : 'bad';

  return (
    <span className={cn(styles.delta, styles[tone])}>
      <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
      <span className="tabular">{formatSignedPercent(delta.percentage)}</span>
      {caption ? <span className={styles.caption}>{caption}</span> : null}
    </span>
  );
}
