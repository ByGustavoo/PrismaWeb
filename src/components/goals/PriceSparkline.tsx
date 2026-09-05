import type { Tendencia } from '@/types';
import { cn } from '@/utils/cn';
import styles from './PriceSparkline.module.css';

interface PriceSparklineProps {
  /** Precos em ordem cronologica; menos de dois pontos nao desenham nada. */
  prices: number[];
  trend: Tendencia;
  className?: string;
}

const WIDTH = 100;
const HEIGHT = 28;
/** Folga vertical para o traco e o ponto final nao encostarem na borda. */
const PADDING = 3;

/**
 * A forma da serie dentro do cartao. E SVG escrito a mao, e nao Recharts: para
 * quatro pontos sem eixo, rotulo nem tooltip, montar um grafico inteiro custaria
 * mais do que informa — e a cor sai de `currentColor`, entao o traco segue o
 * tema sem passar pelo `useChartPalette`.
 *
 * A curva nao substitui os numeros ao lado; ela responde antes deles se o preco
 * vem caindo ha tempo ou se acabou de virar.
 */
export function PriceSparkline({ prices, trend, className }: PriceSparklineProps) {
  if (prices.length < 2) return null;

  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const span = highest - lowest;
  const usable = HEIGHT - PADDING * 2;

  const points = prices.map((price, index) => {
    const x = (index / (prices.length - 1)) * WIDTH;
    // Serie sem variacao nenhuma vira uma reta no meio, e nao colada na base.
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
      {/*
        `non-scaling-stroke` mantem a espessura constante apesar de o viewBox ser
        esticado na horizontal para ocupar a largura do cartao.
      */}
      <polyline className={styles.line} points={path} vectorEffect="non-scaling-stroke" />
      {last ? <circle className={styles.head} cx={last.x} cy={last.y} r={2.5} /> : null}
    </svg>
  );
}
