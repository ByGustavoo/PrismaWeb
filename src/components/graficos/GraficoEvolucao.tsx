import { useId } from 'react';
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import type { PontoEvolucaoDTO } from '@/types';
import { formatarMoedaCompacta } from '@/utils/formatacao';
import { DicaGrafico } from './DicaGrafico';
import styles from './GraficoEvolucao.module.css';

interface GraficoEvolucaoProps {
  dados: PontoEvolucaoDTO[];
  altura?: number;
  rotuloValor?: string;
  rotuloAportado?: string;
}

export function GraficoEvolucao({
  dados,
  altura = 260,
  rotuloValor = 'Patrimônio',
  rotuloAportado = 'Total aportado',
}: GraficoEvolucaoProps) {
  const palette = usePaletaGrafico();
  const gradientId = `prisma-evolucao-${useId().replace(/:/g, '')}`;

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
            width={78}
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
          />
          <Line
            type="monotone"
            dataKey="aportado"
            name={rotuloAportado}
            stroke={palette.series[3]}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
