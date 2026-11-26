import type { Tendencia } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { classeTendenciaPreco } from './aparencia';
import styles from './MiniCurvaPreco.module.css';

interface MiniCurvaPrecoProps {
  precos: number[];
  tendencia: Tendencia;
  className?: string;
}

const LARGURA = 100;
const ALTURA = 28;
const ESPACAMENTO = 3;

export function MiniCurvaPreco({ precos, tendencia, className }: MiniCurvaPrecoProps) {
  if (precos.length < 2) return null;

  const lowest = Math.min(...precos);
  const highest = Math.max(...precos);
  const span = highest - lowest;
  const usable = ALTURA - ESPACAMENTO * 2;

  const points = precos.map((price, index) => {
    const x = (index / (precos.length - 1)) * LARGURA;
    const y = span > 0 ? ALTURA - ESPACAMENTO - ((price - lowest) / span) * usable : ALTURA / 2;
    return { x, y };
  });

  const path = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg
      className={juntarClasses(styles.spark, styles[classeTendenciaPreco[tendencia]], className)}
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <polyline className={styles.line} points={path} vectorEffect="non-scaling-stroke" />
      {last ? <circle className={styles.head} cx={last.x} cy={last.y} r={2.5} /> : null}
    </svg>
  );
}
