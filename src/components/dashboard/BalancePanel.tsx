import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/charts';
import { useChartPalette } from '@/hooks/useChartPalette';
import { Amount, DeltaIndicator } from '@/components/common';
import type { BalancePoint, Delta } from '@/types';
import styles from './BalancePanel.module.css';

interface BalancePanelProps {
  /** "Saldo atual" no periodo corrente; nos anteriores, o saldo no fim dele. */
  label: string;
  balance: number;
  delta: Delta;
  income: number;
  expense: number;
  /** "mês" ou "período", conforme o recorte escolhido no header. */
  periodNoun: string;
  history: BalancePoint[];
}

export function BalancePanel({
  label,
  balance,
  delta,
  income,
  expense,
  periodNoun,
  history,
}: BalancePanelProps) {
  const palette = useChartPalette();
  const lineColor = palette.series[0];

  /*
   * A folga da escala sai da amplitude da serie, nao de um percentual do valor:
   * com saldo negativo, `min * 0.92` levanta o piso acima do proprio minimo e
   * corta a linha no rodape do grafico.
   */
  const values = history.map((point) => point.balance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min || Math.abs(max) || 1) * 0.08;
  const domainMin = min - padding;
  const domainMax = max + padding;

  return (
    <section className={styles.panel} aria-label={label}>
      <div className={styles.summary}>
        <p className={styles.label}>{label}</p>
        <Amount value={balance} size="display" />
        <DeltaIndicator delta={delta} caption={`em relação ao ${periodNoun} anterior`} />

        <dl className={styles.flows}>
          <div className={styles.flow}>
            <dt>Entradas do {periodNoun}</dt>
            <dd>
              <Amount value={income} tone="positive" size="md" sign="plus" />
            </dd>
          </div>
          <div className={styles.flow}>
            <dt>Saídas do {periodNoun}</dt>
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
              // Sem base explicita a area se apoia no zero: um mes com saldo negativo
              // aparece com o preenchimento acima da linha, invertido.
              baseValue={domainMin}
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
