import { useId } from 'react';
import type { CSSProperties } from 'react';
import styles from './SerieInterrompida.module.css';

const HISTORICO: ReadonlyArray<readonly [number, number]> = [
  [10, 124],
  [62, 113],
  [114, 120],
  [166, 96],
  [218, 104],
  [270, 76],
  [322, 84],
  [374, 50],
];

const QUEBRA_X = 374;
const QUEBRA_Y = 50;
const FIM_RASTRO_X = 552;
const LINHA_BASE = 148;

const VARREDURA_MS = 4200;

const VARREDURA_IDA = 0.42;
const DESENHO_MS = Math.round(VARREDURA_MS * VARREDURA_IDA);

const linha = HISTORICO.map(([x, y]) => `${x},${y}`).join(' ');
const area = `M${HISTORICO.map(([x, y]) => `${x},${y}`).join(' L')} L${QUEBRA_X},${LINHA_BASE} L10,${LINHA_BASE} Z`;

function comprimentoAte(index: number) {
  let walked = 0;
  for (let step = 1; step <= index; step += 1) {
    const point = HISTORICO[step];
    const previous = HISTORICO[step - 1];
    if (point && previous) walked += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  }
  return walked;
}

const COMPRIMENTO_DESENHO = comprimentoAte(HISTORICO.length - 1);

export type TomSerieInterrompida = 'acento' | 'erro';

export function SerieInterrompida({ tom = 'acento' }: { tom?: TomSerieInterrompida }) {
  const id = useId().replace(/:/g, '');
  const idArea = `prisma-serie-area-${id}`;
  const idTraco = `prisma-serie-traco-${id}`;
  const idBrilho = `prisma-serie-brilho-${id}`;

  const chartStyle = {
    '--draw-length': COMPRIMENTO_DESENHO.toFixed(2),
    '--draw-duration': `${DESENHO_MS}ms`,
    '--sweep-duration': `${VARREDURA_MS}ms`,
  } as CSSProperties;

  return (
    <svg
      className={styles.chart}
      style={chartStyle}
      data-tom={tom}
      viewBox="0 0 600 150"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={idArea} x1="0" y1="0" x2="0" y2="1">
          <stop className={styles.areaTop} offset="0%" />
          <stop className={styles.areaBottom} offset="100%" />
        </linearGradient>
        <linearGradient id={idTraco} x1="0" y1="0" x2="1" y2="0">
          <stop className={styles.strokeFade} offset="0%" />
          <stop className={styles.strokeFull} offset="14%" />
          <stop className={styles.strokeFull} offset="100%" />
        </linearGradient>
        <filter id={idBrilho} x="-20%" y="-80%" width="140%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {[40, 84, 128].map((y) => (
        <line key={y} className={styles.grid} x1="0" y1={y} x2="600" y2={y} />
      ))}

      <path className={styles.area} d={area} fill={`url(#${idArea})`} />

      <polyline className={styles.glow} points={linha} filter={`url(#${idBrilho})`} />
      <polyline className={styles.line} points={linha} stroke={`url(#${idTraco})`} />

      {HISTORICO.slice(1, -1).map(([x, y], index) => (
        <circle
          key={`${x}-${y}`}
          className={styles.dot}
          style={{ '--delay': `${Math.round((comprimentoAte(index + 1) / COMPRIMENTO_DESENHO) * DESENHO_MS)}ms` } as CSSProperties}
          cx={x}
          cy={y}
          r="3.5"
        />
      ))}

      <line className={styles.marker} x1={QUEBRA_X} y1="18" x2={QUEBRA_X} y2={LINHA_BASE} />
      <path className={styles.trail} d={`M${QUEBRA_X},${QUEBRA_Y} L${FIM_RASTRO_X},${QUEBRA_Y}`} />

      <circle className={styles.point} cx={QUEBRA_X} cy={QUEBRA_Y} r="5" />
      <circle className={styles.pulse} cx={FIM_RASTRO_X} cy={QUEBRA_Y} r="5" />
      <circle className={styles.end} cx={FIM_RASTRO_X} cy={QUEBRA_Y} r="5" />
    </svg>
  );
}
