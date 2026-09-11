import { useId } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './Interruptor.module.css';

export interface InterruptorProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  rotulo: string;
  dica?: string;
  disabled?: boolean;
  className?: string;
}

export function Interruptor({ checked, onChange, rotulo, dica, disabled = false, className }: InterruptorProps) {
  const id = useId();
  const hintId = dica ? `${id}-hint` : undefined;

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

      {dica ? (
        <p className={styles.hint} id={hintId}>
          {dica}
        </p>
      ) : null}
    </div>
  );
}
