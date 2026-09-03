import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { useChartPalette } from '@/hooks/useChartPalette';
import { Amount, DeltaIndicator } from '@/components/common';
import type { BalancePoint, Delta } from '@/types';
import styles from './BalancePanel.module.css';

interface BalancePanelProps {
  balance: number;
  delta: Delta;
  income: number;
  expense: number;
  history: BalancePoint[];
}

export function BalancePanel({ balance, delta, income, expense, history }: BalancePanelProps) {
  const palette = useChartPalette();
  const lineColor = palette.series[0];
  const domainMin = Math.min(...history.map((point) => point.balance)) * 0.92;
  const domainMax = Math.max(...history.map((point) => point.balance)) * 1.04;

  return (
    <section className={styles.panel} aria-label="Saldo atual">
      <div className={styles.summary}>
        <p className={styles.label}>Saldo atual</p>
        <Amount value={balance} size="display" />
        <DeltaIndicator delta={delta} caption="nos últimos 30 dias" />

        <dl className={styles.flows}>
          <div className={styles.flow}>
            <dt>Entradas do mês</dt>
            <dd>
              <Amount value={income} tone="positive" size="md" sign="plus" />
            </dd>
          </div>
          <div className={styles.flow}>
            <dt>Saídas do mês</dt>
            <dd>
              <Amount value={expense} tone="negative" size="md" sign="minus" />
            </dd>
          </div>
          <div className={styles.flow}>
            <dt>Resultado</dt>
            <dd>
              <Amount value={income - expense} tone={income - expense >= 0 ? 'positive' : 'negative'} size="md" sign="auto" />
            </dd>
          </div>
        </dl>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: palette.axisText, fontSize: 12 }}
              dy={6}
            />
            <YAxis hide domain={[domainMin, domainMax]} />
            <Tooltip
              cursor={{ stroke: palette.border, strokeDasharray: '4 4' }}
              content={<ChartTooltip />}
            />
            <Area
              type="monotone"
              dataKey="balance"
              name="Saldo"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#balanceFill)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: palette.surface }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
