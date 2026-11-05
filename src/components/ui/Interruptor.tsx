import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './Interruptor.module.css';

export interface InterruptorProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  rotulo: string;
  dica?: ReactNode;
  explicacao?: ReactNode;
  rotuloExplicacao?: string;
  disabled?: boolean;
  className?: string;
}

export function Interruptor({
  checked,
  onChange,
  rotulo,
  dica,
  explicacao,
  rotuloExplicacao = 'Como funciona?',
  disabled = false,
  className,
}: InterruptorProps) {
  const id = useId();
  const hintId = dica ? `${id}-hint` : undefined;
  const explanationId = `${id}-explicacao`;
  const [explanationOpen, setExplanationOpen] = useState(false);

  return (
    <div className={juntarClasses(styles.row, className)}>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-describedby={hintId}
        disabled={disabled}
        className={styles.control}
        onClick={() => onChange(!checked)}
      >
        <span className={juntarClasses(styles.track, checked && styles.trackOn)} aria-hidden="true">
          <span className={styles.fill} />
          <span className={styles.thumb} />
        </span>
        <span className={styles.label}>{rotulo}</span>
      </button>

      {dica || explicacao ? (
        <p className={styles.hint}>
          {dica ? <span id={hintId}>{dica}</span> : null}
          {explicacao ? (
            <button
              type="button"
              className={styles.more}
              aria-expanded={explanationOpen}
              aria-controls={explanationId}
              onClick={() => setExplanationOpen((open) => !open)}
            >
              <CircleHelp size={14} strokeWidth={2} aria-hidden="true" />
              {rotuloExplicacao}
            </button>
          ) : null}
        </p>
      ) : null}

      {explicacao ? (
        <div id={explanationId} className={styles.explanation} hidden={!explanationOpen}>
          {explicacao}
        </div>
      ) : null}
    </div>
  );
}
