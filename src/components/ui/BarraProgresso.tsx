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

export function BarraProgresso({ valor, tom = 'accent', segmentos, rotulo, className }: BarraProgressoProps) {
  const ratio = Math.min(Math.max(valor, 0), 1);
  const percent = Math.round(ratio * 100);
  const useSegments = typeof segmentos === 'number' && segmentos > 1 && segmentos <= MAXIMO_SEGMENTOS;

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
            className={juntarClasses(styles.segment, index < Math.round(ratio * segmentos) && styles.segmentFilled)}
          />
        ))
      ) : (
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      )}
    </div>
  );
}
