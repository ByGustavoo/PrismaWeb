import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { curvaEntradaSaida, progresso } from '../animacao';
import { abertura, cenas, DURACAO_TOTAL, ordemCenas } from '../linhaDoTempo';
import type { NomeCena } from '../linhaDoTempo';
import { cores } from '../tema';

const HOJE_X = 1480;

function alturaLinha(x: number): number {
  const ondulacao = 10 * Math.sin(x / 150) + 6 * Math.sin(x / 61 + 1.3);
  const subida = interpolate(x, [900, HOJE_X], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const suave = subida * subida * (3 - 2 * subida);
  const continuacao = Math.max(x - HOJE_X, 0) * 0.42;
  return 965 + ondulacao * (1 - suave) - 215 * suave - continuacao;
}

function caminho(de: number, ate: number): string {
  const pontos: string[] = [];
  for (let x = de; x <= ate; x += 8) pontos.push(`${pontos.length === 0 ? 'M' : 'L'}${x} ${alturaLinha(x).toFixed(1)}`);
  return pontos.join(' ');
}

const CAMINHO_REALIZADO = caminho(-40, HOJE_X);
const CAMINHO_PREVISTO = caminho(HOJE_X, 1980);
const AREA = `${caminho(-40, 1980)} L1980 1120 L-40 1120 Z`;

const marcos = [...ordemCenas.map((nome) => cenas[nome].inicio), DURACAO_TOTAL];

const ajustesPorCena: Record<NomeCena, { x: number; y: number; brilho: number; linha: number }> = {
  abertura: { x: 50, y: 46, brilho: 0.5, linha: 1 },
  gancho: { x: 50, y: 42, brilho: 0.36, linha: 0.5 },
  dashboard: { x: 70, y: 50, brilho: 0.42, linha: 0.3 },
  parcelas: { x: 32, y: 50, brilho: 0.4, linha: 0.25 },
  orcamento: { x: 70, y: 50, brilho: 0.4, linha: 0.25 },
  previsao: { x: 32, y: 50, brilho: 0.42, linha: 0.35 },
  investimentos: { x: 70, y: 50, brilho: 0.42, linha: 0.3 },
  metas: { x: 32, y: 52, brilho: 0.4, linha: 0.25 },
  confianca: { x: 50, y: 46, brilho: 0.48, linha: 0.55 },
  encerramento: { x: 50, y: 44, brilho: 0.62, linha: 1 },
};

function valoresPorMarcos(campo: 'x' | 'y' | 'brilho' | 'linha'): number[] {
  const valores = ordemCenas.map((nome) => ajustesPorCena[nome][campo]);
  return [...valores, valores[valores.length - 1] ?? 0];
}

function porMarcos(quadro: number, valores: number[]): number {
  return interpolate(quadro, marcos, valores, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: curvaEntradaSaida,
  });
}

export function Fundo() {
  const quadro = useCurrentFrame();
  const brilhoX = porMarcos(quadro, valoresPorMarcos('x'));
  const brilhoY = porMarcos(quadro, valoresPorMarcos('y'));
  const brilhoForca = porMarcos(quadro, valoresPorMarcos('brilho'));
  const presencaLinha = porMarcos(quadro, valoresPorMarcos('linha'));
  const traco = progresso(quadro, abertura.linhaFundo, 50);
  const previsto = progresso(quadro, abertura.linhaFundo + 40, 30);
  const deriva = interpolate(quadro, [0, DURACAO_TOTAL], [0, -60]);
  const ciclo = (quadro % 150) / 150;

  return (
    <AbsoluteFill style={{ background: cores.fundo, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(236, 238, 240, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(236, 238, 240, 0.035) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          backgroundPosition: `${quadro * 0.25}px ${quadro * 0.4}px`,
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, black 20%, transparent 75%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 720px at ${brilhoX}% ${brilhoY}%, rgba(124, 154, 255, ${0.16 * brilhoForca}), transparent 70%)`,
        }}
      />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: presencaLinha, transform: `translateX(${deriva}px)` }}>
        <defs>
          <linearGradient id="areaSaldo" x1="0" y1="640" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={cores.destaque} stopOpacity={0.16} />
            <stop offset="1" stopColor={cores.destaque} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="previstoSaldo" x1={HOJE_X} y1="0" x2="1980" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={cores.destaque} stopOpacity={0.85} />
            <stop offset="1" stopColor={cores.destaque} stopOpacity={0.3} />
          </linearGradient>
          <clipPath id="revelarSaldo">
            <rect x={-40} y={0} width={(HOJE_X + 40) * traco + 520 * previsto} height={1120} />
          </clipPath>
        </defs>
        <g clipPath="url(#revelarSaldo)">
          <path d={AREA} fill="url(#areaSaldo)" />
          <path d={CAMINHO_REALIZADO} fill="none" stroke={cores.destaque} strokeOpacity={0.85} strokeWidth={3} strokeLinecap="round" />
          <path d={CAMINHO_PREVISTO} fill="none" stroke="url(#previstoSaldo)" strokeWidth={3} strokeDasharray="10 9" />
        </g>
        <circle
          cx={HOJE_X}
          cy={alturaLinha(HOJE_X)}
          r={9 + 14 * ciclo}
          fill="none"
          stroke={cores.destaque}
          strokeWidth={2}
          opacity={traco >= 1 ? 0.5 * (1 - ciclo) : 0}
        />
        <circle cx={HOJE_X} cy={alturaLinha(HOJE_X)} r={7} fill={cores.destaque} opacity={traco >= 1 ? 1 : 0} />
      </svg>
      <AbsoluteFill
        style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.55) 100%)' }}
      />
    </AbsoluteFill>
  );
}
