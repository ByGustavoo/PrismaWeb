import type { CSSProperties } from 'react';
import { Easing, interpolate, spring, useCurrentFrame } from 'remotion';
import { QUADROS_POR_PASSO, QUADROS_POR_SEGUNDO, SOBREPOSICAO } from './linhaDoTempo';

export const curvaSaida = Easing.bezier(0.22, 1, 0.36, 1);
export const curvaEntradaSaida = Easing.bezier(0.65, 0, 0.35, 1);

export function usePasso(): number {
  return useCurrentFrame() / QUADROS_POR_PASSO;
}

export function progresso(passo: number, inicio: number, duracao: number, curva = curvaSaida): number {
  return interpolate(passo, [inicio, inicio + duracao], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: curva,
  });
}

export function mola(passo: number, inicio: number, rigidez = 140, amortecimento = 16): number {
  return spring({
    frame: (passo - inicio) * QUADROS_POR_PASSO,
    fps: QUADROS_POR_SEGUNDO,
    config: { stiffness: rigidez, damping: amortecimento, mass: 1 },
  });
}

export function misturar(de: number, para: number, t: number): number {
  return de + (para - de) * t;
}

export function pulso(passo: number, inicio: number, duracao: number): number {
  return Math.sin(Math.PI * progresso(passo, inicio, duracao, (t) => t));
}

export function estiloTransicaoCena(passo: number, duracao: number, comSaida = true): CSSProperties {
  const entrada = progresso(passo, 0, SOBREPOSICAO + 4);
  const saida = comSaida ? progresso(passo, duracao - SOBREPOSICAO, SOBREPOSICAO, Easing.in(Easing.cubic)) : 0;
  const escala = 0.965 + 0.035 * entrada + 0.07 * saida;
  const desfoque = (1 - entrada) * 16 + saida * 18;
  return {
    opacity: entrada * (1 - saida),
    transform: `scale(${escala})`,
    filter: desfoque > 0.05 ? `blur(${desfoque}px)` : undefined,
  };
}
