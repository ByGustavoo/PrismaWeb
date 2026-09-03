import { cn } from '@/utils/cn';
import { formatCurrencyParts } from '@/utils/format';
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

function resolveSign(value: number, sign: AmountProps['sign']): string {
  if (sign === 'plus') return '+';
  if (sign === 'minus') return '-';
  if (sign === 'auto') return value > 0 ? '+' : value < 0 ? '-' : '';
  // Sem sinal explicito um valor negativo ainda precisa aparecer como negativo.
  return value < 0 ? '-' : '';
}

/**
 * Valor monetario com algarismos tabulares.
 * O simbolo fica em um span proprio: ele usa a familia de interface, enquanto os
 * algarismos usam a familia de numeros. Isso mantem "R$" com o mesmo tamanho,
 * peso e espacamento em todos os tamanhos e em todas as telas.
 */
export function Amount({ value, tone = 'default', size = 'md', sign = 'none', className }: AmountProps) {
  const prefix = resolveSign(value, sign);
  const { symbol, digits } = formatCurrencyParts(Math.abs(value));

  return (
    <span className={cn(styles.amount, styles[tone], styles[size], className)}>
      <span className={styles.symbol}>
        {prefix}
        {symbol}
      </span>
      <span className={cn('tabular', styles.digits)}>{digits}</span>
    </span>
  );
}
