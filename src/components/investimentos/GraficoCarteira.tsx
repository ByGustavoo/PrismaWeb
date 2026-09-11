import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DicaGrafico } from '@/components/graficos';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import type { EvolucaoCarteiraDTO } from '@/types';
import { formatarMoedaCompacta } from '@/utils/formatacao';
import styles from './GraficoCarteira.module.css';

interface GraficoCarteiraProps {
  dados: EvolucaoCarteiraDTO[];
}

export function GraficoCarteira({ dados }: GraficoCarteiraProps) {
  const palette = usePaletaGrafico();

  return (
    <Painel>
      <CabecalhoPainel
        titulo="Evolução do patrimônio"
        descricao="Patrimônio acumulado e total aportado nos últimos doze meses"
      />
      <CorpoPainel className={styles.chart}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="prisma-portfolio" x1="0" y1="0" x2="0" y2="1">
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
              iconType="plainline"
              iconSize={14}
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="valor"
              name="Patrimônio"
              stroke={palette.series[0]}
              strokeWidth={2}
              fill="url(#prisma-portfolio)"
              activeDot={{ r: 4, strokeWidth: 0 }}
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
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CorpoPainel>
    </Painel>
  );
}
