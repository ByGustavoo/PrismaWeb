import { useMemo, useState } from 'react';
import { Amount } from '@/components/common';
import { Card, CardBody, CardHeader } from '@/components/ui';
import type { GastoDiario } from '@/types';
import { cn } from '@/utils/cn';
import { fromISODate, todayISO } from '@/utils/date';
import { formatCurrency, formatFullDate, formatShortMonth } from '@/utils/format';
import styles from './SpendingCalendar.module.css';

interface SpendingCalendarProps {
  days: GastoDiario[];
  description: string;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const LEVELS = [0, 1, 2, 3, 4];

interface MonthBlock {
  key: string;
  offset: number;
  days: GastoDiario[];
}

interface HeatScale {
  q1: number;
  q2: number;
  q3: number;
}

function buildScale(days: GastoDiario[]): HeatScale {
  const sorted = days
    .map((day) => day.valor)
    .filter((amount) => amount > 0)
    .sort((a, b) => a - b);

  const at = (ratio: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;

  return { q1: at(0.25), q2: at(0.5), q3: at(0.75) };
}

function levelOf(amount: number, scale: HeatScale): number {
  if (amount <= 0) return 0;
  if (amount <= scale.q1) return 1;
  if (amount <= scale.q2) return 2;
  if (amount <= scale.q3) return 3;
  return 4;
}

function heaviestWeekday(days: GastoDiario[]): string | null {
  const totals = [0, 0, 0, 0, 0, 0, 0];

  for (const day of days) {
    const index = fromISODate(day.data).getDay();
    totals[index] = (totals[index] ?? 0) + day.valor;
  }

  let best = -1;
  totals.forEach((amount, index) => {
    if (amount > 0 && amount > (totals[best] ?? 0)) best = index;
  });

  return WEEKDAY_NAMES[best] ?? null;
}

function groupByMonth(days: GastoDiario[]): MonthBlock[] {
  const grouped = new Map<string, GastoDiario[]>();

  for (const day of days) {
    const key = day.data.slice(0, 7);
    const list = grouped.get(key);
    if (list) list.push(day);
    else grouped.set(key, [day]);
  }

  return [...grouped.entries()].map(([key, list]) => ({
    key,
    offset: list[0] ? fromISODate(list[0].data).getDay() : 0,
    days: list,
  }));
}

export function SpendingCalendar({ days, description }: SpendingCalendarProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const today = todayISO();
  const months = useMemo(() => groupByMonth(days), [days]);
  const scale = useMemo(() => buildScale(days), [days]);
  const byDate = useMemo(() => new Map(days.map((day) => [day.data, day])), [days]);

  const elapsed = useMemo(() => days.filter((day) => day.data <= today), [days, today]);
  const total = elapsed.reduce((sum, day) => sum + day.valor, 0);
  const average = elapsed.length > 0 ? total / elapsed.length : 0;
  const quietDays = elapsed.filter((day) => day.valor === 0).length;
  const heaviest = useMemo(() => heaviestWeekday(elapsed), [elapsed]);
  const peak = elapsed.reduce<GastoDiario | null>(
    (best, day) => (day.valor > (best?.valor ?? 0) ? day : best),
    null,
  );

  const focus = (hovered ? byDate.get(hovered) : null) ?? null;

  const summary = peak
    ? `Gastos por dia. Maior gasto em ${formatFullDate(peak.data)}: ${formatCurrency(peak.valor)}.`
    : 'Gastos por dia. Nenhuma despesa no período.';

  return (
    <Card>
      <CardHeader
        title="Gastos por dia"
        description={description}
        action={
          focus ? (
            <span className={styles.readout}>
              <span className={styles.readoutLabel}>{formatFullDate(focus.data)}</span>
              <Amount value={focus.valor} size="sm" tone={focus.valor > 0 ? 'negative' : 'muted'} />
            </span>
          ) : null
        }
      />

      <CardBody className={styles.body}>
        <div
          className={styles.calendar}
          role="img"
          aria-label={summary}
          onMouseLeave={() => setHovered(null)}
          onMouseOver={(event) => {
            const date = (event.target as HTMLElement).dataset.date;
            if (date) setHovered(date);
          }}
        >
          {months.map((month) => (
            <div key={month.key} className={styles.month}>
              {months.length > 1 ? <span className={styles.monthName}>{formatShortMonth(month.key)}</span> : null}

              <div className={styles.weekdays} aria-hidden="true">
                {WEEKDAYS.map((initial, index) => (
                  <span key={index}>{initial}</span>
                ))}
              </div>

              <div className={styles.grid}>
                {Array.from({ length: month.offset }, (_, index) => (
                  <span key={`blank-${index}`} className={styles.blank} />
                ))}

                {month.days.map((day) => (
                  <span
                    key={day.data}
                    data-date={day.data}
                    className={cn(
                      styles.day,
                      styles[`level${levelOf(day.valor, scale)}`],
                      day.data > today && styles.ahead,
                      day.data === today && styles.today,
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.side}>
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt>Média diária</dt>
              <dd>
                <Amount value={average} size="sm" />
              </dd>
            </div>
            <div className={styles.stat}>
              <dt>Maior gasto num dia</dt>
              <dd>
                <Amount value={peak?.valor ?? 0} size="sm" />
              </dd>
            </div>
            <div className={styles.stat}>
              <dt>Dia da semana mais caro</dt>
              <dd>{heaviest ?? '—'}</dd>
            </div>
            <div className={styles.stat}>
              <dt>Dias sem gasto</dt>
              <dd className="tabular">
                {quietDays} de {elapsed.length}
              </dd>
            </div>
          </dl>

          <div className={styles.legend} aria-hidden="true">
            <span>Menos</span>
            {LEVELS.map((level) => (
              <span key={level} className={cn(styles.swatch, styles[`level${level}`])} />
            ))}
            <span>Mais</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
