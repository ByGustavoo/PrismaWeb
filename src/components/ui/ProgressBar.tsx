import { cn } from '@/utils/cn';
import styles from './ProgressBar.module.css';

export type ProgressTone = 'accent' | 'positive' | 'warning' | 'negative' | 'neutral';

export interface ProgressBarProps {
  value: number;
  tone?: ProgressTone;
  segments?: number;
  label: string;
  className?: string;
}

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
