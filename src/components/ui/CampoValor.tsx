import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import type { ChangeEvent, ClipboardEvent, FocusEvent } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import { colarEntradaMonetaria, editarEntradaMonetaria } from '@/utils/mascaraValor';
import type { ResultadoMascara } from '@/utils/mascaraValor';
import { CampoTexto } from './CampoTexto';
import type { CampoTextoProps } from './CampoTexto';
import styles from './Campo.module.css';

export interface CampoValorProps
  extends Omit<CampoTextoProps, 'value' | 'onChange' | 'prefixo' | 'inputMode' | 'type' | 'limiteCaracteres'> {
  valor: string;
  aoMudar: (valor: string) => void;
  permitirNegativo?: boolean;
}

export const CampoValor = forwardRef<HTMLInputElement, CampoValorProps>(function CampoValor(
  { valor, aoMudar, permitirNegativo = false, onBlur, onPaste, className, placeholder = '0,00', ...rest },
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

  const aplicar = ({ texto, cursor }: ResultadoMascara) => {
    pendingCursor.current = cursor;
    aoMudar(texto);
    if (texto === valor && innerRef.current) {
      innerRef.current.value = texto;
      innerRef.current.setSelectionRange(cursor, cursor);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    aplicar(
      editarEntradaMonetaria({
        anterior: valor,
        bruto: input.value,
        cursor: input.selectionStart ?? input.value.length,
        tipo: (event.nativeEvent as InputEvent).inputType,
        permitirNegativo,
      }),
    );
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();
    const input = event.currentTarget;
    aplicar(
      colarEntradaMonetaria({
        anterior: input.value,
        colado: event.clipboardData.getData('text'),
        inicio: input.selectionStart ?? input.value.length,
        fim: input.selectionEnd ?? input.value.length,
        permitirNegativo,
      }),
    );
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (valor !== '' && !/\d/.test(valor)) aoMudar('');
    onBlur?.(event);
  };

  return (
    <CampoTexto
      ref={setRefs}
      {...rest}
      className={juntarClasses(styles.money, className)}
      prefixo="R$"
      type="text"
      inputMode={permitirNegativo ? 'decimal' : 'numeric'}
      autoComplete="off"
      placeholder={placeholder}
      value={valor}
      onChange={handleChange}
      onPaste={handlePaste}
      onBlur={handleBlur}
    />
  );
});
