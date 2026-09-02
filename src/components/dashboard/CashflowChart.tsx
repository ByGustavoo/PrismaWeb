import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { useChartPalette } from '@/hooks/useChartPalette';
import { Card, CardBody, CardHeader } from '@/components/ui';
import type { CashflowPoint } from '@/types';
import { formatCompactCurrency, formatCurrency } from '@/utils/format';
import styles from './CashflowChart.module.css';

interface CashflowChartProps {
  data: CashflowPoint[];
}

export function CashflowChart({ data }: CashflowChartProps) {
  const palette = useChartPalette();

  return (
    <Card>
      <CardHeader title="Entradas e saidas" description="Comparativo dos ultimos seis meses" />
      <CardBody className={styles.chart}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barGap={6} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={palette.grid} />
            <XAxis
              dataKey="label"
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
              content={<ChartTooltip formatValue={formatCurrency} />}
            />
            <Legend
              iconType="square"
              iconSize={9}
              wrapperStyle={{ paddingTop: 12, fontSize: 13, color: 'var(--text-muted)' }}
            />
            <Bar dataKey="income" name="Entradas" fill={palette.series[1]} radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="expense" name="Saidas" fill={palette.series[2]} radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
