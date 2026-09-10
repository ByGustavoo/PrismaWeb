import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { CHARACTER_COUNTER_THRESHOLD } from '@/constants/validation';
import { cn } from '@/utils/cn';
import { textLength } from '@/utils/validation';
import styles from './Field.module.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  characterLimit?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, characterLimit, className, id, rows = 3, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  const length = typeof rest.value === 'string' ? textLength(rest.value) : 0;
  const counter =
    characterLimit !== undefined && length >= characterLimit * CHARACTER_COUNTER_THRESHOLD
      ? { length, limit: characterLimit, over: length > characterLimit }
      : null;

  const message = error ? (
    <p className={styles.error} id={`${fieldId}-error`}>
      {error}
    </p>
  ) : hint ? (
    <p className={styles.hint} id={`${fieldId}-hint`}>
      {hint}
    </p>
  ) : null;

  return (
    <div className={cn(styles.field, className)}>
      {label ? (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className={cn(styles.control, styles.controlMultiline, error && styles.controlError)}>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          className={cn(styles.input, styles.textarea)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>

      {counter ? (
        <div className={styles.foot}>
          {message}
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
