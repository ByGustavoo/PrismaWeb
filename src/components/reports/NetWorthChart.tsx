import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { NetWorthPoint } from '@/types';
import { formatCompactCurrency } from '@/utils/format';
import styles from './ReportChart.module.css';

interface NetWorthChartProps {
  data: NetWorthPoint[];
}

/**
 * Evolucao do patrimonio, empilhada em conta e investimento. O empilhamento e a
 * escolha central: o topo continua sendo o total, mas a divisao mostra dinheiro
 * migrando de um lado para o outro — um total estavel pode esconder exatamente
 * isso, e e o que um aporte faz todo mes.
 */
export function NetWorthChart({ data }: NetWorthChartProps) {
  const palette = useChartPalette();

  return (
    <Card>
      <CardHeader
        title="Evolução do patrimônio"
        description="O que está em conta e o que está investido, mês a mês"
      />
      <CardBody className={styles.chart}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
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
            <Tooltip cursor={{ stroke: palette.border }} content={<ChartTooltip />} />
            <Legend
              iconType="square"
              iconSize={9}
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="accounts"
              name="Em conta"
              stackId="patrimonio"
              stroke={palette.series[0]}
              strokeWidth={2}
              fill="url(#prisma-networth-accounts)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="investments"
              name="Investido"
              stackId="patrimonio"
              stroke={palette.series[5]}
              strokeWidth={2}
              fill="url(#prisma-networth-investments)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
