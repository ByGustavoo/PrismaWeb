import { useEffect, useRef, useState } from 'react';

const DURATION = 900;

function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 5;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface CountUp {
  value: number;
  running: boolean;
}

export function useCountUp(target: number, enabled: boolean): CountUp {
  const [shouldRun] = useState(() => enabled && !prefersReducedMotion());
  const [value, setValue] = useState(() => (shouldRun ? 0 : target));
  const [running, setRunning] = useState(shouldRun);
  const done = useRef(!shouldRun);

  useEffect(() => {
    if (done.current) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(Math.max((now - start) / DURATION, 0), 1);

      if (progress < 1) {
        setValue(target * easeOut(progress));
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

  return { value, running };
}
