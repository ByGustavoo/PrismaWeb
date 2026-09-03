import { useId } from 'react';
import { cn } from '@/utils/cn';
import styles from './Switch.module.css';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Chave de duas posicoes para preferencias booleanas de formulario. Um `Select`
 * de "Sim/Nao" resolveria, mas custa dois cliques e uma leitura a mais para uma
 * decisao que cabe num toque.
 *
 * O rotulo e o proprio alvo, entao a area de acionamento e a linha inteira — e
 * nao so o desenho de 40px da chave.
 */
export function Switch({ checked, onChange, label, hint, disabled = false, className }: SwitchProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cn(styles.row, className)}>
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
        <span className={cn(styles.track, checked && styles.trackOn)} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
        <span className={styles.label}>{label}</span>
      </button>

      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
