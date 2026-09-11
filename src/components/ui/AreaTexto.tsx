import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { LIMIAR_CONTADOR_CARACTERES } from '@/constants/validacao';
import { juntarClasses } from '@/utils/juntarClasses';
import { tamanhoTexto } from '@/utils/validacao';
import styles from './Campo.module.css';

export interface AreaTextoProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  rotulo?: string;
  dica?: string;
  erro?: string;
  limiteCaracteres?: number;
}

export const AreaTexto = forwardRef<HTMLTextAreaElement, AreaTextoProps>(function Textarea(
  { rotulo, dica, erro, limiteCaracteres, className, id, rows = 3, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = erro ? `${fieldId}-error` : dica ? `${fieldId}-hint` : undefined;

  const length = typeof rest.value === 'string' ? tamanhoTexto(rest.value) : 0;
  const counter =
    limiteCaracteres !== undefined && length >= limiteCaracteres * LIMIAR_CONTADOR_CARACTERES
      ? { length, limit: limiteCaracteres, over: length > limiteCaracteres }
      : null;

  const message = erro ? (
    <p className={styles.error} id={`${fieldId}-error`}>
      {erro}
    </p>
  ) : dica ? (
    <p className={styles.hint} id={`${fieldId}-hint`}>
      {dica}
    </p>
  ) : null;

  return (
    <div className={juntarClasses(styles.field, className)}>
      {rotulo ? (
        <label className={styles.label} htmlFor={fieldId}>
          {rotulo}
          {required ? (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className={juntarClasses(styles.control, styles.controlMultiline, erro && styles.controlError)}>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          className={juntarClasses(styles.input, styles.textarea)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>

      {counter ? (
        <div className={styles.foot}>
          {message}
          <span className={juntarClasses(styles.counter, counter.over && styles.counterOver, 'tabular')} aria-hidden="true">
            {counter.length}/{counter.limit}
          </span>
        </div>
      ) : (
        message
      )}
    </div>
  );
});
