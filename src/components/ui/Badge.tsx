import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'positive' | 'negative' | 'warning' | 'accent';

export interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', dot = false, children, className }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[tone], className)}>
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
