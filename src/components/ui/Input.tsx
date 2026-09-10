import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CHARACTER_COUNTER_THRESHOLD } from '@/constants/validation';
import { cn } from '@/utils/cn';
import { textLength } from '@/utils/validation';
import styles from './Field.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  /** Texto fixo antes do campo, como o "R$" de um valor. */
  prefix?: string;
  /**
   * Limite de caracteres. Nao corta a digitacao como o `maxLength` — um texto
   * colado perderia o fim sem aviso —: perto do limite aparece um contador, e
   * quem valida o excesso e o formulario.
   */
  characterLimit?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon: Icon, prefix, characterLimit, className, id, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  const length = typeof rest.value === 'string' ? textLength(rest.value) : 0;
  const counter =
    characterLimit !== undefined && length >= characterLimit * CHARACTER_COUNTER_THRESHOLD
      ? { length, limit: characterLimit, over: length > characterLimit }
      : null;

  const message = error ? (
    <p className={styles.error} id={`${inputId}-error`}>
      {error}
    </p>
  ) : hint ? (
    <p className={styles.hint} id={`${inputId}-hint`}>
      {hint}
    </p>
  ) : null;

  return (
    <div className={cn(styles.field, className)}>
      {label ? (
        <label className={styles.label} htmlFor={inputId}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className={cn(styles.control, error && styles.controlError)}>
        {Icon ? <Icon className={styles.icon} size={16} strokeWidth={2} /> : null}
        {prefix ? (
          <span className={styles.prefix} aria-hidden="true">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>

      {counter ? (
        <div className={styles.foot}>
          {message}
          {/* Quem usa leitor de tela recebe o excesso pela mensagem de erro do campo. */}
          <span className={cn(styles.counter, counter.over && styles.counterOver, 'tabular')} aria-hidden="true">
            {counter.length}/{counter.limit}
          </span>
        </div>
      ) : (
        message
      )}
    </div>
  );
});
