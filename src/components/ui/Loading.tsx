import { cn } from '@/utils/cn';
import styles from './Loading.module.css';

export interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 20, label }: SpinnerProps) {
  return (
    <span className={styles.spinnerWrapper} role="status" aria-live="polite">
      <span className={styles.spinner} style={{ width: size, height: size }} />
      {label ? <span className={styles.spinnerLabel}>{label}</span> : <span className="visually-hidden">Carregando</span>}
    </span>
  );
}

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-xs)', className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

/** Bloco de carregamento para areas grandes (cards, tabelas). */
export function LoadingBlock({ lines = 3, height = 240 }: { lines?: number; height?: number }) {
  return (
    <div className={styles.block} style={{ minHeight: height }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} height={index === 0 ? 28 : 14} width={index === 0 ? '45%' : `${90 - index * 12}%`} />
      ))}
    </div>
  );
}
