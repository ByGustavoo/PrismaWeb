import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import styles from './Field.module.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, rows = 3, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn(styles.field, className)}>
      {label ? (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      ) : null}

      <div className={cn(styles.control, styles.controlMultiline, error && styles.controlError)}>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          className={cn(styles.input, styles.textarea)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>

      {error ? (
        <p className={styles.error} id={`${fieldId}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint} id={`${fieldId}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
});
