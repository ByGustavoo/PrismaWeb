import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useIsCompact } from '@/hooks/useMediaQuery';
import type { ForecastMonth } from '@/types';
import { formatCompactCurrency } from '@/utils/format';
import styles from './ForecastChart.module.css';

interface ForecastChartProps {
  data: ForecastMonth[];
}

/**
 * Teto do eixo de fluxo: o maior valor com 35% de folga, arredondado para cima
 * ate um degrau redondo. A folga afasta a linha do saldo do topo das barras; o
 * arredondamento existe porque um limite cru deixa o eixo terminando em
 * "R$ 19,4 mil" e desalinha os degraus intermediarios.
 */
function flowCeiling(max: number): number {
  if (max <= 0) return 1;
  const target = max * 1.35;
  const step = 10 ** Math.floor(Math.log10(target)) / 2;
  return Math.ceil(target / step) * step;
}

/**
 * Receitas, despesas e saldo previsto no mesmo desenho. As barras respondem
 * "quanto entra e quanto sai por mes" e a linha responde "e como fica o caixa"
 * — sao perguntas diferentes, com ordens de grandeza diferentes, por isso a
 * linha usa um eixo proprio a direita. Num eixo unico, o fluxo de um mes viraria
 * um traco rente ao chao ao lado de um saldo de dezenas de milhares.
 */
export function ForecastChart({ data }: ForecastChartProps) {
  const palette = useChartPalette();
  /*
   * Em tela estreita o eixo do saldo sai. Dois eixos custam cerca de 150px dos
   * 358 disponiveis, e o que sobra nao acomoda doze barras com os meses
   * legiveis. A linha continua desenhada — a forma da curva e o que se le de
   * relance — e o valor exato de cada mes esta na lista logo abaixo.
   */
  const compact = useIsCompact();

  return (
    <Card>
      <CardHeader
        title="Entradas, saídas e saldo previsto"
        description="Projeção mês a mês a partir do saldo de hoje"
      />
      <CardBody className={styles.chart}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={data}
            barGap={6}
            barCategoryGap="28%"
            margin={{ top: 8, right: 0, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke={palette.grid} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.axisText, fontSize: 12 }}
              dy={6}
            />
            <YAxis
              yAxisId="flow"
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.axisText, fontSize: 12 }}
              tickFormatter={formatCompactCurrency}
              /*
               * Folga no topo para a linha do saldo nao encostar nas barras.
               * Sem ela, os dois eixos coincidiam justamente onde o saldo cruza
               * o topo das receitas, e a linha parecia apoiada nas barras em vez
               * de correr acima delas.
               */
              domain={[0, flowCeiling]}
              width={compact ? 72 : 78}
            />
            <YAxis
              yAxisId="balance"
              orientation="right"
              hide={compact}
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.axisText, fontSize: 12 }}
              tickFormatter={formatCompactCurrency}
              width={72}
            />
            <Tooltip cursor={{ fill: palette.surfaceMuted }} content={<ChartTooltip />} />
            <Legend
              iconType="square"
              iconSize={9}
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
            />
            <Bar
              yAxisId="flow"
              dataKey="income"
              name="Receitas previstas"
              fill={palette.series[1]}
              radius={[4, 4, 0, 0]}
              maxBarSize={26}
            />
            <Bar
              yAxisId="flow"
              dataKey="expense"
              name="Despesas previstas"
              fill={palette.series[2]}
              radius={[4, 4, 0, 0]}
              maxBarSize={26}
            />
            <Line
              yAxisId="balance"
              type="monotone"
              dataKey="endingBalance"
              name="Saldo previsto"
              stroke={palette.series[0]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: palette.series[0] }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
