import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { tamanhoTexto } from '@/utils/validacao';

export type ErrosCampos<T> = Partial<Record<keyof T, string>>;

interface OpcoesValidacaoFormulario<T> {
  limites?: Partial<Record<keyof T, number>>;
}

export interface ValidacaoFormulario<T> {
  erros: ErrosCampos<T>;
  refFormulario: RefObject<HTMLFormElement>;
  tocar: (field: keyof T) => void;
  enviar: () => boolean;
  reiniciar: () => void;
}

export function useValidacaoFormulario<T extends object>(
  values: T,
  validate: (values: T) => ErrosCampos<T>,
  { limites }: OpcoesValidacaoFormulario<T> = {},
): ValidacaoFormulario<T> {
  const [revealed, setRevealed] = useState<ReadonlySet<keyof T>>(() => new Set());
  const refFormulario = useRef<HTMLFormElement>(null);

  const found = validate(values);
  const erros: ErrosCampos<T> = {};

  for (const field of Object.keys(found) as Array<keyof T>) {
    const message = found[field];
    if (!message) continue;

    const limit = limites?.[field];
    const raw = values[field];
    const overLimit = limit !== undefined && typeof raw === 'string' && tamanhoTexto(raw) > limit;

    if (overLimit || revealed.has(field)) erros[field] = message;
  }

  const tocar = (field: keyof T) => {
    const raw = values[field];
    if (!found[field] || revealed.has(field)) return;
    if (typeof raw === 'string' && raw.trim() === '') return;
    setRevealed((current) => new Set(current).add(field));
  };

  const enviar = () => {
    setRevealed(new Set(Object.keys(values) as Array<keyof T>));

    if (!Object.values(found).some(Boolean)) return true;

    requestAnimationFrame(() => {
      refFormulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
    return false;
  };

  const reiniciar = useCallback(() => setRevealed(new Set()), []);

  return { erros, refFormulario, tocar, enviar, reiniciar };
}
