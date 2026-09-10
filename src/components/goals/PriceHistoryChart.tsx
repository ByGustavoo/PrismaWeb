import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { GoalPriceEntry, Tendencia } from '@/types';
import { formatCompactCurrency, formatNumericDate } from '@/utils/format';
import styles from './PriceHistoryChart.module.css';

interface PriceHistoryChartProps {
  history: GoalPriceEntry[];
  averagePrice: number;
  trend: Tendencia;
}

function dayLabel(isoDate: string): string {
  return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;
}

const AXIS_PADDING_RATIO = 0.2;

const AXIS_STEPS = 4;

const NICE_STEPS = [1, 2, 2.5, 5, 10];

function niceAxis(min: number, max: number): { domain: [number, number]; ticks: number[] } {
  const raw = (max - min) / AXIS_STEPS;
  const magnitude = 10 ** Math.floor(Math.log10(raw || 1));
  const multiplier = NICE_STEPS.find((value) => magnitude * value >= raw) ?? 10;
  const step = magnitude * multiplier;

  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }

  return { domain: [start, end], ticks };
}

export function PriceHistoryChart({ history, averagePrice, trend }: PriceHistoryChartProps) {
  const palette = useChartPalette();
  const color = trend === 'ALTA' ? palette.series[2] : trend === 'BAIXA' ? palette.series[1] : palette.series[0];

  const data = history.map((entry) => ({
    label: dayLabel(entry.date),
    date: entry.date,
    price: entry.price,
  }));

  const prices = history.map((entry) => entry.price);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const padding = Math.max((highest - lowest) * AXIS_PADDING_RATIO, highest * 0.02);
  const axis = niceAxis(lowest - padding, highest + padding);

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="prisma-goal-price" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.26} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
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
            domain={axis.domain}
            ticks={axis.ticks}
            width={78}
          />
          <Tooltip
            cursor={{ stroke: palette.border }}
            content={<ChartTooltip />}
            labelFormatter={(_label, payload) => {
              const point = payload?.[0]?.payload as { date?: string } | undefined;
              return point?.date ? formatNumericDate(point.date) : '';
            }}
          />
          <ReferenceLine
            y={averagePrice}
            stroke={palette.border}
            strokeDasharray="4 4"
            label={{ value: 'Média', position: 'insideTopRight', fill: palette.axisText, fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="price"
            name="Preço"
            stroke={color}
            strokeWidth={2}
            fill="url(#prisma-goal-price)"
            dot={{ r: 3, strokeWidth: 0, fill: color }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
