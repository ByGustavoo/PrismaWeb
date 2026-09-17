import { useId } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './MiniCurva.module.css';

interface MiniCurvaProps {
  valores: number[];
  className?: string;
}

const LARGURA = 100;
const ALTURA = 36;
const ESPACAMENTO = 3;

export function MiniCurva({ valores, className }: MiniCurvaProps) {
  const gradientId = `prisma-minicurva-${useId().replace(/:/g, '')}`;
  if (valores.length < 2) return null;

  const lowest = Math.min(...valores);
  const highest = Math.max(...valores);
  const span = highest - lowest;
  const usable = ALTURA - ESPACAMENTO * 2;

  const points = valores.map((value, index) => ({
    x: ESPACAMENTO + (index / (valores.length - 1)) * (LARGURA - ESPACAMENTO * 2),
    y: span > 0 ? ALTURA - ESPACAMENTO - ((value - lowest) / span) * usable : ALTURA / 2,
  }));

  const line = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  const area = `${ESPACAMENTO},${ALTURA} ${line} ${LARGURA - ESPACAMENTO},${ALTURA}`;
  const last = points[points.length - 1];

  return (
    <svg
      className={juntarClasses(styles.spark, className)}
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline className={styles.line} points={line} vectorEffect="non-scaling-stroke" />
      {last ? <circle className={styles.head} cx={last.x} cy={last.y} r={2.5} /> : null}
    </svg>
  );
}
