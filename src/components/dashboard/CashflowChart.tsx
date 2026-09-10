import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { useChartPalette } from '@/hooks/useChartPalette';
import { Card, CardBody, CardHeader } from '@/components/ui';
import type { PontoFluxo } from '@/types';
import { formatCompactCurrency } from '@/utils/format';
import styles from './CashflowChart.module.css';

interface CashflowChartProps {
  data: PontoFluxo[];
  description: string;
  title?: string;
  maxBarSize?: number;
}

export function CashflowChart({
  data,
  description,
  title = 'Entradas e saídas',
  maxBarSize = 26,
}: CashflowChartProps) {
  const palette = useChartPalette();

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className={styles.chart}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            barGap={6}
            barCategoryGap="28%"
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke={palette.grid} />
            <XAxis
              dataKey="rotulo"
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.axisText, fontSize: 12 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.axisText, fontSize: 12 }}
              tickFormatter={formatCompactCurrency}
              width={78}
            />
            <Tooltip
              cursor={{ fill: palette.surfaceMuted }}
              content={<ChartTooltip />}
            />
            <Legend
              iconType="square"
              iconSize={9}
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
            />
            <Bar dataKey="receitas" name="Entradas" fill={palette.series[1]} radius={[4, 4, 0, 0]} maxBarSize={maxBarSize} />
            <Bar dataKey="despesas" name="Saídas" fill={palette.series[2]} radius={[4, 4, 0, 0]} maxBarSize={maxBarSize} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
