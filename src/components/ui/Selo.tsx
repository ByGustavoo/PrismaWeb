import type { ReactNode } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './Selo.module.css';

export type TomSelo = 'neutral' | 'positive' | 'negative' | 'warning' | 'accent';

export interface SeloProps {
  tom?: TomSelo;
  ponto?: boolean;
  children: ReactNode;
  className?: string;
}

export function Selo({ tom = 'neutral', ponto = false, children, className }: SeloProps) {
  return (
    <span className={juntarClasses(styles.badge, styles[tom], className)}>
      {ponto ? <span className={styles.dot} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
