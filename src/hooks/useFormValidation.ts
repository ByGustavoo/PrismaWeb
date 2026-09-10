import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { textLength } from '@/utils/validation';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

interface FormValidationOptions<T> {
  limits?: Partial<Record<keyof T, number>>;
}

export interface FormValidation<T> {
  errors: FieldErrors<T>;
  formRef: RefObject<HTMLFormElement>;
  touch: (field: keyof T) => void;
  submit: () => boolean;
  reset: () => void;
}

export function useFormValidation<T extends object>(
  values: T,
  validate: (values: T) => FieldErrors<T>,
  { limits }: FormValidationOptions<T> = {},
): FormValidation<T> {
  const [revealed, setRevealed] = useState<ReadonlySet<keyof T>>(() => new Set());
  const formRef = useRef<HTMLFormElement>(null);

  const found = validate(values);
  const errors: FieldErrors<T> = {};

  for (const field of Object.keys(found) as Array<keyof T>) {
    const message = found[field];
    if (!message) continue;

    const limit = limits?.[field];
    const raw = values[field];
    const overLimit = limit !== undefined && typeof raw === 'string' && textLength(raw) > limit;

    if (overLimit || revealed.has(field)) errors[field] = message;
  }

  const touch = (field: keyof T) => {
    const raw = values[field];
    if (!found[field] || revealed.has(field)) return;
    if (typeof raw === 'string' && raw.trim() === '') return;
    setRevealed((current) => new Set(current).add(field));
  };

  const submit = () => {
    setRevealed(new Set(Object.keys(values) as Array<keyof T>));

    if (!Object.values(found).some(Boolean)) return true;

    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
    return false;
  };

  const reset = useCallback(() => setRevealed(new Set()), []);

  return { errors, formRef, touch, submit, reset };
}
