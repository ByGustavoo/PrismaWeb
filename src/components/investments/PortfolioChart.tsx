import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { PortfolioPoint } from '@/types';
import { formatCompactCurrency } from '@/utils/format';
import styles from './PortfolioChart.module.css';

interface PortfolioChartProps {
  data: PortfolioPoint[];
}

/**
 * Evolucao do patrimonio contra o total aportado. As duas series juntas sao o
 * ponto: a area sozinha mostra o dinheiro crescendo sem dizer quanto disso foi
 * aporte e quanto foi rendimento — a distancia entre a linha e a area e a
 * resposta, e ela se le sem nenhum numero.
 */
export function PortfolioChart({ data }: PortfolioChartProps) {
  const palette = useChartPalette();

  return (
    <Card>
      <CardHeader
        title="Evolução do patrimônio"
        description="Patrimônio acumulado e total aportado nos últimos doze meses"
      />
      <CardBody className={styles.chart}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="prisma-portfolio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.series[0]} stopOpacity={0.28} />
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
              width={78}
            />
            <Tooltip cursor={{ stroke: palette.border }} content={<ChartTooltip />} />
            <Legend
              iconType="plainline"
              iconSize={14}
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span className={styles.legendLabel}>{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Patrimônio"
              stroke={palette.series[0]}
              strokeWidth={2}
              fill="url(#prisma-portfolio)"
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            {/*
              Tracejada de proposito: o aporte e a referencia contra a qual se le
              o patrimonio, nao uma segunda medida de mesmo peso.
            */}
            <Line
              type="monotone"
              dataKey="invested"
              name="Total aportado"
              stroke={palette.series[3]}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
