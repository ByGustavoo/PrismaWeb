import { useState } from 'react';
import type { CSSProperties } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './BarraProgresso.module.css';

export type TomProgresso = 'accent' | 'positive' | 'warning' | 'negative' | 'neutral';

export interface BarraProgressoProps {
  valor: number;
  tom?: TomProgresso;
  segmentos?: number;
  rotulo: string;
  className?: string;
}

const MAXIMO_SEGMENTOS = 24;

function ordemNaTroca(index: number, from: number, to: number): number {
  if (to > from && index >= from && index < to) return index - from;
  if (to < from && index >= to && index < from) return from - 1 - index;
  return 0;
}

export function BarraProgresso({ valor, tom = 'accent', segmentos, rotulo, className }: BarraProgressoProps) {
  const ratio = Math.min(Math.max(valor, 0), 1);
  const percent = Math.round(ratio * 100);
  const useSegments = typeof segmentos === 'number' && segmentos > 1 && segmentos <= MAXIMO_SEGMENTOS;
  const filled = useSegments ? Math.round(ratio * segmentos) : 0;

  const [change, setChange] = useState({ from: filled, to: filled });
  if (change.to !== filled) setChange({ from: change.to, to: filled });

  return (
    <div
      className={juntarClasses(styles.track, useSegments && styles.segmented, styles[tom], className)}
      role="progressbar"
      aria-label={rotulo}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${percent}%`}
    >
      {useSegments ? (
        Array.from({ length: segmentos }).map((_, index) => (
          <span
            key={index}
            className={juntarClasses(
              styles.segment,
              index < filled && styles.segmentFilled,
              index >= change.from && index < change.to && styles.segmentArriving,
            )}
            style={{ '--ordem': ordemNaTroca(index, change.from, change.to) } as CSSProperties}
          />
        ))
      ) : (
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      )}
    </div>
  );
}
