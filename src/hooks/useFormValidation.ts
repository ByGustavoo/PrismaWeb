import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { textLength } from '@/utils/validation';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

interface FormValidationOptions<T> {
  /** Limite de caracteres por campo de texto; passar dele mostra o erro na hora. */
  limits?: Partial<Record<keyof T, number>>;
}

export interface FormValidation<T> {
  /** Os erros que ja podem aparecer na tela. */
  errors: FieldErrors<T>;
  /** Ligado ao `<form>`: e onde o envio procura o primeiro campo invalido. */
  formRef: RefObject<HTMLFormElement>;
  /** Para o `onBlur` dos campos digitados. */
  touch: (field: keyof T) => void;
  /** Revela todos os erros e leva o foco ao primeiro. Devolve `true` quando da para enviar. */
  submit: () => boolean;
  /** Volta ao estado de formulario recem-aberto. */
  reset: () => void;
}

/**
 * Decide quando cada erro aparece. Os erros sao sempre recalculados a partir
 * dos valores; o hook guarda so quais campos ja podem mostrar o seu.
 *
 * - Durante a primeira digitacao, nada: corrigir quem ainda nao terminou de
 *   escrever e hostil.
 * - Ao sair de um campo preenchido com erro, ele aparece. Campo vazio espera o
 *   envio — senao abrir o formulario e clicar direto num seletor pintaria de
 *   vermelho o campo que recebeu o foco automatico.
 * - Depois de aparecer, o erro acompanha a digitacao e some no instante em que
 *   o valor fica valido, e nao na primeira tecla com o valor ainda errado.
 * - Texto acima do limite de caracteres e a excecao: o erro vem na hora, porque
 *   cada letra a mais e trabalho que vai ser apagado.
 */
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

    // Sem isso o formulario so pinta os erros e deixa a pessoa procurar qual
    // campo falhou — pior ainda quando o primeiro esta fora da area visivel.
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
    return false;
  };

  const reset = useCallback(() => setRevealed(new Set()), []);

  return { errors, formRef, touch, submit, reset };
}
