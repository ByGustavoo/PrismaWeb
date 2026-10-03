import type { CSSProperties, ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cores, fontes } from '../tema';

const formatoNumero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatoPercentual = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatarNumero(valor: number): string {
  return formatoNumero.format(Math.abs(valor));
}

export function formatarMoeda(valor: number): string {
  return `${valor < 0 ? '-' : ''}R$ ${formatarNumero(valor)}`;
}

export function formatarPercentual(valor: number): string {
  return `${formatoPercentual.format(valor)}%`;
}

interface ValorMonetarioProps {
  valor: number;
  tamanho: number;
  cor?: string;
  sinal?: boolean;
  peso?: number;
  estilo?: CSSProperties;
}

export function ValorMonetario({ valor, tamanho, cor = cores.texto, sinal = false, peso = 600, estilo }: ValorMonetarioProps) {
  const prefixo = valor < 0 ? '-' : sinal && valor > 0 ? '+' : '';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: tamanho * 0.2, color: cor, whiteSpace: 'nowrap', ...estilo }}>
      <span style={{ fontFamily: fontes.texto, fontSize: tamanho * 0.52, fontWeight: 600 }}>
        {prefixo}R$
      </span>
      <span style={{ fontFamily: fontes.numero, fontSize: tamanho, fontWeight: peso, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
        {formatarNumero(valor)}
      </span>
    </span>
  );
}

interface BotaoProps {
  children: ReactNode;
  principal?: boolean;
  escala?: number;
  estilo?: CSSProperties;
}

export function Botao({ children, principal = false, escala = 1, estilo }: BotaoProps) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '12px 22px',
        borderRadius: 12,
        fontFamily: fontes.texto,
        fontSize: 21,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        background: principal ? cores.superficieInvertida : 'transparent',
        color: principal ? cores.textoInvertido : cores.texto,
        border: principal ? '1.5px solid transparent' : `1.5px solid ${cores.bordaForte}`,
        transform: `scale(${escala})`,
        ...estilo,
      }}
    >
      {children}
    </span>
  );
}

export function Selo({ children, cor, fundo, tamanho = 18, estilo }: { children: ReactNode; cor: string; fundo: string; tamanho?: number; estilo?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 11px',
        borderRadius: 8,
        background: fundo,
        color: cor,
        fontFamily: fontes.texto,
        fontSize: tamanho,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...estilo,
      }}
    >
      {children}
    </span>
  );
}

export function IndicadorVariacao({ percentual, tamanho = 19 }: { percentual: number; tamanho?: number }) {
  const cor = percentual > 0 ? cores.positivo : percentual < 0 ? cores.negativo : cores.textoSecundario;
  const Icone = percentual > 0 ? ArrowUpRight : percentual < 0 ? ArrowDownRight : Minus;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: cor, fontFamily: fontes.numero, fontSize: tamanho, fontWeight: 600 }}>
      <Icone size={tamanho} strokeWidth={2.4} />
      {percentual > 0 ? '+' : percentual < 0 ? '-' : ''}
      {formatarPercentual(Math.abs(percentual))}
    </span>
  );
}

export function BarraProgresso({ valor, cor, altura = 10 }: { valor: number; cor: string; altura?: number }) {
  return (
    <div style={{ height: altura, borderRadius: altura / 2, background: cores.neutroSuave, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(Math.max(valor, 0), 1) * 100}%`, height: '100%', borderRadius: altura / 2, background: cor }} />
    </div>
  );
}

export function ItemResumo({ rotulo, children, apoio, opacidade = 1, primeiro = false }: { rotulo: string; children: ReactNode; apoio?: ReactNode; opacidade?: number; primeiro?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '18px 22px',
        borderLeft: primeiro ? 'none' : `1.5px solid ${cores.borda}`,
        fontFamily: fontes.texto,
        opacity: opacidade,
        transform: `translateY(${(1 - opacidade) * 14}px)`,
      }}
    >
      <span style={{ fontSize: 18, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>{rotulo}</span>
      {children}
      {apoio ? <span style={{ fontSize: 16, lineHeight: 1.35, color: cores.textoSecundario }}>{apoio}</span> : null}
    </div>
  );
}

export function pressao(quadro: number, clique: number): number {
  if (quadro < clique || quadro > clique + 6) return 1;
  return 1 - 0.06 * Math.sin((Math.PI * (quadro - clique)) / 6);
}
