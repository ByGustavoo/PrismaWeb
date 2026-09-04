import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Amount, DeltaIndicator } from '@/components/common';
import type { Delta } from '@/types';
import styles from './StatTile.module.css';

interface StatTileProps {
  label: string;
  value: number;
  icon: LucideIcon;
  delta?: Delta;
  footnote?: ReactNode;
}

export function StatTile({ label, value, icon: Icon, delta, footnote }: StatTileProps) {
  return (
    <article className={styles.tile}>
      <header className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.iconBox} aria-hidden="true">
          <Icon size={16} strokeWidth={2} />
        </span>
      </header>

      {/* Conta na entrada; depois disso troca rolando, com o seletor de periodo. */}
      <Amount value={value} size="lg" animate countUp />

      <footer className={styles.footer}>
        {delta ? <DeltaIndicator delta={delta} /> : null}
        {footnote ? <span className={styles.footnote}>{footnote}</span> : null}
      </footer>
    </article>
  );
}
