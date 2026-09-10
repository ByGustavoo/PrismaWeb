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

function flowCeiling(max: number): number {
  if (max <= 0) return 1;
  const target = max * 1.35;
  const step = 10 ** Math.floor(Math.log10(target)) / 2;
  return Math.ceil(target / step) * step;
}

export function ForecastChart({ data }: ForecastChartProps) {
  const palette = useChartPalette();
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
