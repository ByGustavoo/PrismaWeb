import { cn } from '@/utils/cn';
import styles from './ProgressBar.module.css';

export type ProgressTone = 'accent' | 'positive' | 'warning' | 'negative' | 'neutral';

export interface ProgressBarProps {
  /** Progresso de 0 a 1; valores fora da faixa sao aparados. */
  value: number;
  tone?: ProgressTone;
  /**
   * Divide a barra em partes iguais. Use quando o progresso for contavel — seis
   * de doze parcelas se leem de relance em seis blocos cheios, nao numa faixa
   * pela metade.
   */
  segments?: number;
  /** Descricao para leitor de tela; o valor em si ja e anunciado. */
  label: string;
  className?: string;
}

/** Acima disso os blocos ficam finos demais e a barra continua se lendo melhor. */
const MAX_SEGMENTS = 24;

export function ProgressBar({ value, tone = 'accent', segments, label, className }: ProgressBarProps) {
  const ratio = Math.min(Math.max(value, 0), 1);
  const percent = Math.round(ratio * 100);
  const useSegments = typeof segments === 'number' && segments > 1 && segments <= MAX_SEGMENTS;

  return (
    <div
      className={cn(styles.track, useSegments && styles.segmented, styles[tone], className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${percent}%`}
    >
      {useSegments ? (
        Array.from({ length: segments }).map((_, index) => (
          <span
            key={index}
            className={cn(styles.segment, index < Math.round(ratio * segments) && styles.segmentFilled)}
          />
        ))
      ) : (
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      )}
    </div>
  );
}
