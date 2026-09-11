import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DicaGrafico } from '@/components/graficos';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import type { PatrimonioDTO } from '@/types';
import { formatarMoedaCompacta } from '@/utils/formatacao';
import styles from './GraficoRelatorio.module.css';

interface GraficoPatrimonioProps {
  dados: PatrimonioDTO[];
}

export function GraficoPatrimonio({ dados }: GraficoPatrimonioProps) {
  const palette = usePaletaGrafico();

  return (
    <Painel>
      <CabecalhoPainel
        titulo="Evolução do patrimônio"
        descricao="O que está em conta e o que está investido, mês a mês"
      />
      <CorpoPainel className={styles.chart}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="prisma-networth-accounts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.series[0]} stopOpacity={0.34} />
                <stop offset="100%" stopColor={palette.series[0]} stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="prisma-networth-investments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.series[5]} stopOpacity={0.34} />
                <stop offset="100%" stopColor={palette.series[5]} stopOpacity={0.08} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke={palette.grade} />
            <XAxis
              dataKey="rotulo"
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.textoEixo, fontSize: 12 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.textoEixo, fontSize: 12 }}
              tickFormatter={formatarMoedaCompacta}
              width={78}
            />
            <Tooltip cursor={{ stroke: palette.borda }} content={<DicaGrafico />} />
            <Legend
              iconType="square"
              iconSize={9}
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="contas"
              name="Em conta"
              stackId="patrimonio"
              stroke={palette.series[0]}
              strokeWidth={2}
              fill="url(#prisma-networth-accounts)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="investimentos"
              name="Investido"
              stackId="patrimonio"
              stroke={palette.series[5]}
              strokeWidth={2}
              fill="url(#prisma-networth-investments)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CorpoPainel>
    </Painel>
  );
}
