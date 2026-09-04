import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { GoalPriceEntry, Trend } from '@/types';
import { formatCompactCurrency, formatNumericDate } from '@/utils/format';
import styles from './PriceHistoryChart.module.css';

interface PriceHistoryChartProps {
  /** Registros em ordem cronologica. */
  history: GoalPriceEntry[];
  averagePrice: number;
  trend: Trend;
}

/** "2026-09-04" -> "04/09", o rotulo curto do eixo. */
function dayLabel(isoDate: string): string {
  return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;
}

/**
 * Folga aplicada ao eixo. Sem ela o Recharts abriria a escala no zero, e uma
 * variacao de 15% numa serie que orbita os R$ 5.000,00 viraria uma reta.
 */
const AXIS_PADDING_RATIO = 0.2;

/** Quantos intervalos o eixo de valores tem; quatro cabem sem apertar. */
const AXIS_STEPS = 4;

/** Passos aceitos, em multiplos da magnitude: 100, 200, 250, 500, 1000... */
const NICE_STEPS = [1, 2, 2.5, 5, 10];

/**
 * Uma escala com marcas redondas. Deixar o Recharts dividir o intervalo cru
 * produzia "R$ 989,9" e "R$ 919,9" num eixo de precos — numeros que ninguem
 * escreveria, e que fazem o leitor conferir a casa decimal em vez de olhar a
 * curva.
 */
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

/**
 * A evolucao do preco. A cor segue a mesma logica do indicador do cartao —
 * queda em verde, alta em vermelho —, para que grafico e numero nunca contem
 * historias diferentes sobre a mesma meta.
 *
 * A tracejada da media nao e enfeite: e contra ela que se le "o preço atual
 * está abaixo da média", a frase que a analise mostra logo acima.
 */
export function PriceHistoryChart({ history, averagePrice, trend }: PriceHistoryChartProps) {
  const palette = useChartPalette();
  const color = trend === 'up' ? palette.series[2] : trend === 'down' ? palette.series[1] : palette.series[0];

  const data = history.map((entry) => ({
    label: dayLabel(entry.date),
    date: entry.date,
    price: entry.price,
  }));

  const prices = history.map((entry) => entry.price);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  // Serie de preco unico ainda precisa de faixa, senao o eixo colapsa num ponto.
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
