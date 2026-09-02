import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import styles from './Field.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon: Icon, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn(styles.field, className)}>
      {label ? (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      ) : null}

      <div className={cn(styles.control, error && styles.controlError)}>
        {Icon ? <Icon className={styles.icon} size={16} strokeWidth={2} /> : null}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>

      {error ? (
        <p className={styles.error} id={`${inputId}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint} id={`${inputId}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
});
