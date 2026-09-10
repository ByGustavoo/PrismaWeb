import type { CSSProperties } from 'react';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/utils/cn';
import { formatCurrencyParts } from '@/utils/format';
import styles from './Amount.module.css';

export type AmountTone = 'default' | 'positive' | 'negative' | 'muted';
export type AmountSize = 'sm' | 'md' | 'lg' | 'display';

export interface AmountProps {
  value: number;
  tone?: AmountTone;
  size?: AmountSize;
  sign?: 'auto' | 'plus' | 'minus' | 'none';
  animate?: boolean;
  countUp?: boolean;
  className?: string;
}

function resolveSign(value: number, sign: AmountProps['sign']): string {
  if (sign === 'plus') return '+';
  if (sign === 'minus') return '-';
  if (sign === 'auto') return value > 0 ? '+' : value < 0 ? '-' : '';
  return value < 0 ? '-' : '';
}

export function Amount({
  value,
  tone = 'default',
  size = 'md',
  sign = 'none',
  animate = false,
  countUp = false,
  className,
}: AmountProps) {
  const { value: shown, running } = useCountUp(value, countUp);

  const prefix = resolveSign(shown, sign);
  const { symbol, digits } = formatCurrencyParts(Math.abs(shown));

  return (
    <span className={cn(styles.amount, styles[tone], styles[size], className)}>
      <span className={styles.symbol}>
        {prefix}
        {symbol}
      </span>
      {animate && !running ? (
        <RollingDigits digits={digits} />
      ) : (
        <span className={cn('tabular', styles.digits)}>{digits}</span>
      )}
    </span>
  );
}

const WHEEL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const MAX_STAGGER = 5;

function RollingDigits({ digits }: { digits: string }) {
  const chars = [...digits];

  return (
    <>
      <span className="visually-hidden">{digits}</span>

      <span className={cn('tabular', styles.digits, styles.roller)} aria-hidden="true">
        {chars.map((char, index) => {
          const key = chars.length - index;
          const digit = WHEEL.indexOf(char);

          if (digit < 0) {
            return (
              <span key={key} className={styles.separator}>
                {char}
              </span>
            );
          }

          return (
            <span key={key} className={styles.slot}>
              <span className={styles.ghost}>0</span>
              <span
                className={styles.wheel}
                style={{ '--digit': digit, '--order': Math.min(index, MAX_STAGGER) } as CSSProperties}
              >
                {WHEEL.map((face) => (
                  <span key={face} className={styles.face}>
                    {face}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}
