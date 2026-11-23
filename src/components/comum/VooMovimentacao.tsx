import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './VooMovimentacao.module.css';

export const DURACAO_VOO_MOVIMENTACAO_MS = 640;
const DURACAO_POUSO_MS = 200;
const ESCALA_DECOLAGEM = 0.62;
const ELEVACAO_MAXIMA_ARCO_PX = 120;

interface VooMovimentacaoProps {
  origem: DOMRect;
  destino: () => HTMLElement | null;
  aoPousar: () => void;
  children: ReactNode;
}

function suavizar(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function sair(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function VooMovimentacao({ origem, destino, aoPousar, children }: VooMovimentacaoProps) {
  const ghostRef = useRef<HTMLDivElement>(null);
  const aoPousarRef = useRef(aoPousar);
  aoPousarRef.current = aoPousar;

  useLayoutEffect(() => {
    const ghost = ghostRef.current;
    if (!ghost) return;

    const inset = parseFloat(getComputedStyle(ghost).paddingLeft) + ghost.clientLeft;
    const originX = origem.left + origem.width / 2;
    const originY = origem.top + origem.height / 2;
    let frame = 0;
    let started: number | null = null;
    let landing: Animation | null = null;

    const step = (now: number) => {
      if (started === null) started = now;
      const progress = Math.min(1, (now - started) / DURACAO_VOO_MOVIMENTACAO_MS);
      const target = destino();
      if (!target) {
        ghost.style.opacity = '0';
        return;
      }

      const row = target.getBoundingClientRect();
      const width = row.width + inset * 2;
      ghost.style.width = `${width}px`;
      const height = ghost.offsetHeight;
      const startX = originX - width / 2;
      const startY = originY - height / 2;
      const endX = row.left - inset;
      const endY = row.top + target.scrollHeight / 2 - height / 2;
      const lift = Math.min(ELEVACAO_MAXIMA_ARCO_PX, Math.hypot(endX - startX, endY - startY) * 0.35);
      const controlX = (startX + endX) / 2;
      const controlY = Math.min(startY, endY) - lift;
      const t = suavizar(progress);
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;
      const scale = ESCALA_DECOLAGEM + (1 - ESCALA_DECOLAGEM) * sair(progress);
      ghost.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      ghost.style.opacity = String(Math.min(1, progress / 0.16));

      if (progress < 1) {
        frame = requestAnimationFrame(step);
        return;
      }

      landing = ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: DURACAO_POUSO_MS,
        easing: 'ease-in',
        fill: 'forwards',
      });
      landing.onfinish = () => aoPousarRef.current();
    };

    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      landing?.cancel();
    };
  }, [origem, destino]);

  return createPortal(
    <div ref={ghostRef} className={styles.ghost} aria-hidden="true">
      {children}
    </div>,
    document.body,
  );
}
