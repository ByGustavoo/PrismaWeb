import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DicaGrafico } from '@/components/graficos';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { usePaletaGrafico } from '@/hooks/usePaletaGrafico';
import { useEhCompacto } from '@/hooks/useConsultaMidia';
import type { MesPrevisaoDTO } from '@/types';
import { formatarMoedaCompacta } from '@/utils/formatacao';
import styles from './GraficoPrevisao.module.css';

interface GraficoPrevisaoProps {
  dados: MesPrevisaoDTO[];
}

function tetoFluxo(max: number): number {
  if (max <= 0) return 1;
  const target = max * 1.35;
  const step = 10 ** Math.floor(Math.log10(target)) / 2;
  return Math.ceil(target / step) * step;
}

export function GraficoPrevisao({ dados }: GraficoPrevisaoProps) {
  const palette = usePaletaGrafico();
  const compact = useEhCompacto();

  return (
    <Painel>
      <CabecalhoPainel
        titulo="Entradas, saídas e saldo previsto"
        descricao="Projeção a partir do saldo previsto para o fim deste mês. As saídas somam despesas e aportes."
      />
      <CorpoPainel className={styles.chart}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={dados}
            barGap={6}
            barCategoryGap="28%"
            margin={{ top: 8, right: 0, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke={palette.grade} />
            <XAxis
              dataKey="rotulo"
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.textoEixo, fontSize: 12 }}
              dy={6}
            />
            <YAxis
              yAxisId="flow"
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.textoEixo, fontSize: 12 }}
              tickFormatter={formatarMoedaCompacta}
              domain={[0, tetoFluxo]}
              width={compact ? 72 : 78}
            />
            <YAxis
              yAxisId="balance"
              orientation="right"
              hide={compact}
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.textoEixo, fontSize: 12 }}
              tickFormatter={formatarMoedaCompacta}
              width={72}
            />
            <Tooltip cursor={{ fill: palette.superficieSuave }} content={<DicaGrafico />} />
            <Legend
              iconType="square"
              iconSize={9}
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
            />
            <Bar
              yAxisId="flow"
              dataKey="receita"
              name="Receitas previstas"
              fill={palette.series[1]}
              radius={[4, 4, 0, 0]}
              maxBarSize={26}
            />
            <Bar
              yAxisId="flow"
              dataKey="despesa"
              name="Despesas previstas"
              stackId="saidas"
              fill={palette.series[2]}
              maxBarSize={26}
            />
            <Bar
              yAxisId="flow"
              dataKey="aportes"
              name="Aportes"
              stackId="saidas"
              fill={palette.series[4]}
              radius={[4, 4, 0, 0]}
              maxBarSize={26}
            />
            <Line
              yAxisId="balance"
              type="monotone"
              dataKey="saldoFinal"
              name="Saldo previsto"
              stroke={palette.series[0]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: palette.series[0] }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CorpoPainel>
    </Painel>
  );
}
