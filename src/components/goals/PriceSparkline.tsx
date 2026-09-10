import type { Tendencia } from '@/types';
import { cn } from '@/utils/cn';
import styles from './PriceSparkline.module.css';

interface PriceSparklineProps {
  prices: number[];
  trend: Tendencia;
  className?: string;
}

const WIDTH = 100;
const HEIGHT = 28;
const PADDING = 3;

export function PriceSparkline({ prices, trend, className }: PriceSparklineProps) {
  if (prices.length < 2) return null;

  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const span = highest - lowest;
  const usable = HEIGHT - PADDING * 2;

  const points = prices.map((price, index) => {
    const x = (index / (prices.length - 1)) * WIDTH;
    const y = span > 0 ? HEIGHT - PADDING - ((price - lowest) / span) * usable : HEIGHT / 2;
    return { x, y };
  });

  const path = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg
      className={cn(styles.spark, styles[trend], className)}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <polyline className={styles.line} points={path} vectorEffect="non-scaling-stroke" />
      {last ? <circle className={styles.head} cx={last.x} cy={last.y} r={2.5} /> : null}
    </svg>
  );
}
