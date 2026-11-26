import { useId } from 'react';
import type { CSSProperties } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import { useLarguraEixoMoeda } from '@/hooks/useLarguraEixoMoeda';
import type { PontoEvolucaoDTO } from '@/types';
import { formatarMoedaCompacta } from '@/utils/formatacao';
import { DicaGrafico } from './DicaGrafico';
import styles from './GraficoEvolucao.module.css';

const DURACAO_ANIMACAO_EVOLUCAO_MS = 800;

interface GraficoEvolucaoProps {
  dados: PontoEvolucaoDTO[];
  altura?: number;
  rotuloValor?: string;
  pulsoNoUltimo?: number;
}

interface FormaPulso {
  cx?: number;
  cy?: number;
}

export function GraficoEvolucao({
  dados,
  altura = 260,
  rotuloValor = 'Patrimônio',
  pulsoNoUltimo,
}: GraficoEvolucaoProps) {
  const palette = usePaletaGrafico();
  const larguraEixo = useLarguraEixoMoeda(dados.flatMap((ponto) => [ponto.valor, ponto.aportado]));
  const gradientId = `prisma-evolucao-${useId().replace(/:/g, '')}`;
  const ultimo = dados[dados.length - 1];
  const animar = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={altura}>
        <ComposedChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.series[0]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={palette.series[0]} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke={palette.grade} />
          <XAxis
            dataKey="rotulo"
            axisLine={false}
            tickLine={false}
            tick={{ fill: palette.textoEixo, fontSize: 12 }}
            dy={6}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: palette.textoEixo, fontSize: 12 }}
            tickFormatter={formatarMoedaCompacta}
            width={larguraEixo}
            domain={['auto', 'auto']}
          />
          <Tooltip cursor={{ stroke: palette.borda }} content={<DicaGrafico />} />
          <Legend
            iconType="plainline"
            iconSize={14}
            wrapperStyle={{ paddingTop: 12 }}
            formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="valor"
            name={rotuloValor}
            stroke={palette.series[0]}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={animar}
            animationDuration={DURACAO_ANIMACAO_EVOLUCAO_MS}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="aportado"
            name="Total aportado"
            stroke={palette.series[3]}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={animar}
            animationDuration={DURACAO_ANIMACAO_EVOLUCAO_MS}
            animationEasing="ease-out"
          />
          {pulsoNoUltimo && ultimo ? (
            <ReferenceDot
              key={pulsoNoUltimo}
              x={ultimo.rotulo}
              y={ultimo.valor}
              ifOverflow="visible"
              shape={({ cx, cy }: FormaPulso) =>
                cx === undefined || cy === undefined ? (
                  <g />
                ) : (
                  <g
                    className={styles.pulse}
                    style={{ '--atraso-pulso': `${animar ? DURACAO_ANIMACAO_EVOLUCAO_MS * 0.75 : 0}ms` } as CSSProperties}
                  >
                    <circle className={styles.pulseHalo} cx={cx} cy={cy} r={6} fill={palette.series[0]} />
                    <circle
                      className={styles.pulseDot}
                      cx={cx}
                      cy={cy}
                      r={4.5}
                      fill={palette.series[0]}
                      stroke={palette.superficie}
                      strokeWidth={2}
                    />
                  </g>
                )
              }
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
