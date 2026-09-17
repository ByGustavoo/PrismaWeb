import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import type { ChangeEvent, ClipboardEvent, FocusEvent, KeyboardEvent } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import {
  completarEntradaMonetaria,
  formatarEntradaMonetaria,
  normalizarColagemMonetaria,
} from '@/utils/mascaraValor';
import { CampoTexto } from './CampoTexto';
import type { CampoTextoProps } from './CampoTexto';
import styles from './Campo.module.css';

export interface CampoValorProps
  extends Omit<CampoTextoProps, 'value' | 'onChange' | 'prefixo' | 'inputMode' | 'type' | 'limiteCaracteres'> {
  valor: string;
  aoMudar: (valor: string) => void;
  permitirNegativo?: boolean;
}

const SEPARADORES = new Set([',', '.']);

export const CampoValor = forwardRef<HTMLInputElement, CampoValorProps>(function CampoValor(
  { valor, aoMudar, permitirNegativo = false, onBlur, onKeyDown, onPaste, className, placeholder = '0,00', ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const pendingCursor = useRef<number | null>(null);

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useLayoutEffect(() => {
    const input = innerRef.current;
    const cursor = pendingCursor.current;
    if (!input || cursor === null || document.activeElement !== input) return;
    input.setSelectionRange(cursor, cursor);
    pendingCursor.current = null;
  });

  const aplicar = (raw: string, cursor: number) => {
    const result = formatarEntradaMonetaria(raw, cursor, { permitirNegativo });
    pendingCursor.current = result.cursor;
    aoMudar(result.texto);
    if (result.texto === valor && innerRef.current) {
      innerRef.current.value = result.texto;
      innerRef.current.setSelectionRange(result.cursor, result.cursor);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const native = event.nativeEvent as InputEvent;
    let raw = input.value;
    let cursor = input.selectionStart ?? raw.length;

    if (native.inputType === 'insertText' && native.data && SEPARADORES.has(native.data)) {
      if (valor.includes(',')) {
        const previousCursor = Math.max(cursor - 1, 0);
        pendingCursor.current = previousCursor;
        input.value = valor;
        input.setSelectionRange(previousCursor, previousCursor);
        return;
      }
      raw = `${raw.slice(0, cursor - 1)},${raw.slice(cursor)}`;
    }

    if (permitirNegativo && native.data === '-') {
      const unsigned = raw.replace(/-/g, '');
      const wasNegative = valor.startsWith('-');
      raw = wasNegative ? unsigned : `-${unsigned}`;
      cursor = wasNegative ? Math.max(cursor - 2, 0) : cursor;
    }

    aplicar(raw, cursor);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const input = event.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start !== end) return;

    if (event.key === 'Backspace' && start > 0 && input.value.charAt(start - 1) === '.') {
      input.setSelectionRange(start - 1, start - 1);
    }
    if (event.key === 'Delete' && input.value.charAt(start) === '.') {
      input.setSelectionRange(start + 1, start + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();
    const input = event.currentTarget;
    const pasted = normalizarColagemMonetaria(event.clipboardData.getData('text'));
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    const safePasted = before.includes(',') || after.includes(',') ? pasted.replace(',', '') : pasted;
    const unsignedPasted = before.length > 0 ? safePasted.replace('-', '') : safePasted;

    aplicar(`${before}${unsignedPasted}${after}`, before.length + unsignedPasted.length);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const completed = completarEntradaMonetaria(valor);
    if (completed !== valor) aoMudar(completed);
    onBlur?.(event);
  };

  return (
    <CampoTexto
      ref={setRefs}
      {...rest}
      className={juntarClasses(styles.money, className)}
      prefixo="R$"
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={valor}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onBlur={handleBlur}
    />
  );
});
