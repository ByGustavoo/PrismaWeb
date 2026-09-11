import { useEffect, useRef, useState } from 'react';

const DURACAO = 900;

function desacelerar(progress: number): number {
  return 1 - (1 - progress) ** 5;
}

function prefereMovimentoReduzido(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface Contagem {
  valor: number;
  executando: boolean;
}

export function useContagem(target: number, enabled: boolean): Contagem {
  const [shouldRun] = useState(() => enabled && !prefereMovimentoReduzido());
  const [valor, setValue] = useState(() => (shouldRun ? 0 : target));
  const [executando, setRunning] = useState(shouldRun);
  const done = useRef(!shouldRun);

  useEffect(() => {
    if (done.current) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(Math.max((now - start) / DURACAO, 0), 1);

      if (progress < 1) {
        setValue(target * desacelerar(progress));
        frame = requestAnimationFrame(step);
        return;
      }

      done.current = true;
      setValue(target);
      setRunning(false);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return { valor, executando };
}
