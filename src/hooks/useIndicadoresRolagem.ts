import { useCallback, useEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';

interface IndicadoresRolagem {
  rolavel: boolean;
  acima: boolean;
  abaixo: boolean;
}

export function useIndicadoresRolagem<T extends HTMLElement>(dependencias: DependencyList) {
  const ref = useRef<T>(null);
  const [indicadores, setIndicadores] = useState<IndicadoresRolagem>({ rolavel: false, acima: false, abaixo: false });

  const medir = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const next = {
      rolavel: element.scrollHeight > element.clientHeight + 1,
      acima: element.scrollTop > 1,
      abaixo: element.scrollTop + element.clientHeight < element.scrollHeight - 1,
    };

    setIndicadores((current) =>
      current.rolavel === next.rolavel && current.acima === next.acima && current.abaixo === next.abaixo
        ? current
        : next,
    );
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(medir);
    observer.observe(element);
    Array.from(element.children).forEach((child) => observer.observe(child));
    medir();
    return () => observer.disconnect();
  }, [medir, ...dependencias]);

  return { ref, medir, ...indicadores };
}
