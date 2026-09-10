import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export const HEADER_SLOT_ID = 'header-slot';

export function HeaderSlot({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById(HEADER_SLOT_ID));
  }, []);

  return target ? createPortal(children, target) : null;
}
