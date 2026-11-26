import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export type AreaInterna = RefObject<Element | null> | string;

function estaDentro(alvo: EventTarget | null, area: AreaInterna): boolean {
  if (typeof area === 'string') return alvo instanceof Element && alvo.closest(area) !== null;
  return alvo instanceof Node && area.current?.contains(alvo) === true;
}

export function useCliqueFora(ativo: boolean, areas: AreaInterna[], aoClicarFora: () => void): void {
  const areasRef = useRef(areas);
  const aoClicarForaRef = useRef(aoClicarFora);
  areasRef.current = areas;
  aoClicarForaRef.current = aoClicarFora;

  useEffect(() => {
    if (!ativo) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (areasRef.current.some((area) => estaDentro(event.target, area))) return;
      aoClicarForaRef.current();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [ativo]);
}
