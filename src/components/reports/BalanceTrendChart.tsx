import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { BalancePoint } from '@/types';
import { formatCompactCurrency } from '@/utils/format';
import styles from './ReportChart.module.css';

interface BalanceTrendChartProps {
  data: BalancePoint[];
}

/**
 * Evolucao do saldo dentro do recorte. O eixo nao comeca em zero de proposito:
 * saldo varia numa faixa estreita perto de um valor alto, e forcar o zero
 * transformaria meses de diferenca real numa linha reta.
 */
export function BalanceTrendChart({ data }: BalanceTrendChartProps) {
  const palette = useChartPalette();

  return (
    <Card>
      <CardHeader title="Evolução do saldo" description="Saldo somado das contas ao fim de cada intervalo" />
      <CardBody className={styles.chart}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="prisma-balance-trend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.series[0]} stopOpacity={0.26} />
                <stop offset="100%" stopColor={palette.series[0]} stopOpacity={0.02} />
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
              domain={['auto', 'auto']}
              width={78}
            />
            <Tooltip cursor={{ stroke: palette.border }} content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              name="Saldo"
              stroke={palette.series[0]}
              strokeWidth={2}
              fill="url(#prisma-balance-trend)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
