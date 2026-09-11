import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export const ID_ESPACO_CABECALHO = 'header-slot';

export function EspacoCabecalho({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById(ID_ESPACO_CABECALHO));
  }, []);

  return target ? createPortal(children, target) : null;
}
