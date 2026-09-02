import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/format';
import styles from './Amount.module.css';

export type AmountTone = 'default' | 'positive' | 'negative' | 'muted';
export type AmountSize = 'sm' | 'md' | 'lg' | 'display';

export interface AmountProps {
  value: number;
  tone?: AmountTone;
  size?: AmountSize;
  /** Mostra "+" ou "-" antes do valor. */
  sign?: 'auto' | 'plus' | 'minus' | 'none';
  className?: string;
}

/**
 * Valor monetario com algarismos tabulares.
 * Padroniza como o dinheiro aparece em toda a aplicacao.
 */
export function Amount({ value, tone = 'default', size = 'md', sign = 'none', className }: AmountProps) {
  const prefix =
    sign === 'plus' ? '+' : sign === 'minus' ? '-' : sign === 'auto' ? (value > 0 ? '+' : value < 0 ? '-' : '') : '';

  return (
    <span className={cn('tabular', styles.amount, styles[tone], styles[size], className)}>
      {prefix}
      {formatCurrency(Math.abs(value))}
    </span>
  );
}
