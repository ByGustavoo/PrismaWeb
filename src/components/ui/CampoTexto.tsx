import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LIMIAR_CONTADOR_CARACTERES } from '@/constants/validacao';
import { juntarClasses } from '@/utils/juntarClasses';
import { tamanhoTexto } from '@/utils/validacao';
import styles from './Campo.module.css';

export interface CampoTextoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string;
  dica?: string;
  erro?: string;
  icone?: LucideIcon;
  prefixo?: string;
  limiteCaracteres?: number;
}

export const CampoTexto = forwardRef<HTMLInputElement, CampoTextoProps>(function Input(
  { rotulo, dica, erro, icone: Icon, prefixo, limiteCaracteres, className, id, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = erro ? `${inputId}-error` : dica ? `${inputId}-hint` : undefined;

  const length = typeof rest.value === 'string' ? tamanhoTexto(rest.value) : 0;
  const counter =
    limiteCaracteres !== undefined && length >= limiteCaracteres * LIMIAR_CONTADOR_CARACTERES
      ? { length, limit: limiteCaracteres, over: length > limiteCaracteres }
      : null;

  const message = erro ? (
    <p className={styles.error} id={`${inputId}-error`}>
      {erro}
    </p>
  ) : dica ? (
    <p className={styles.hint} id={`${inputId}-hint`}>
      {dica}
    </p>
  ) : null;

  return (
    <div className={juntarClasses(styles.field, className)}>
      {rotulo ? (
        <label className={styles.label} htmlFor={inputId}>
          {rotulo}
          {required ? (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className={juntarClasses(styles.control, erro && styles.controlError)}>
        {Icon ? <Icon className={styles.icon} size={16} strokeWidth={2} /> : null}
        {prefixo ? (
          <span className={styles.prefix} aria-hidden="true">
            {prefixo}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          required={required}
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
