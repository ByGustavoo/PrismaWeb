import { useMemo, useState } from 'react';
import { Amount } from '@/components/common';
import { Card, CardBody, CardHeader } from '@/components/ui';
import type { DailySpending } from '@/types';
import { cn } from '@/utils/cn';
import { fromISODate, todayISO } from '@/utils/date';
import { formatCurrency, formatFullDate, formatShortMonth } from '@/utils/format';
import styles from './SpendingCalendar.module.css';

interface SpendingCalendarProps {
  /** Todos os dias do periodo, em ordem, inclusive os sem gasto. */
  days: DailySpending[];
  description: string;
}

/** Iniciais dos dias da semana, na ordem do calendario brasileiro. */
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const LEVELS = [0, 1, 2, 3, 4];

interface MonthBlock {
  key: string;
  /** Dia da semana em que o mes comeca: quantas casas vazias abrem a grade. */
  offset: number;
  days: DailySpending[];
}

interface HeatScale {
  q1: number;
  q2: number;
  q3: number;
}

/**
 * Os degraus saem dos quartis dos dias com gasto, nao de fracoes do maior valor.
 * Uma unica compra grande no mes achataria todo o resto contra o primeiro nivel,
 * e o calendario ficaria com uma casa escura no meio de trinta iguais.
 */
function buildScale(days: DailySpending[]): HeatScale {
  const sorted = days
    .map((day) => day.amount)
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

/**
 * O dia da semana que mais pesa na soma. E a leitura que so este bloco oferece:
 * as colunas ja separam segunda de sabado, mas ninguem soma sete colunas de
 * olho — e saber que o fim de semana leva o dobro do resto muda o que se faz
 * com o proximo sabado.
 */
function heaviestWeekday(days: DailySpending[]): string | null {
  const totals = [0, 0, 0, 0, 0, 0, 0];

  for (const day of days) {
    const index = fromISODate(day.date).getDay();
    totals[index] = (totals[index] ?? 0) + day.amount;
  }

  let best = -1;
  totals.forEach((amount, index) => {
    if (amount > 0 && amount > (totals[best] ?? 0)) best = index;
  });

  return WEEKDAY_NAMES[best] ?? null;
}

function groupByMonth(days: DailySpending[]): MonthBlock[] {
  const grouped = new Map<string, DailySpending[]>();

  for (const day of days) {
    const key = day.date.slice(0, 7);
    const list = grouped.get(key);
    if (list) list.push(day);
    else grouped.set(key, [day]);
  }

  return [...grouped.entries()].map(([key, list]) => ({
    key,
    offset: list[0] ? fromISODate(list[0].date).getDay() : 0,
    days: list,
  }));
}

/**
 * O gasto de cada dia como um calendario de calor. Os graficos do dashboard
 * respondem "quanto" e "em que"; este responde "quando" — se o mes foi parelho
 * ou se tres dias levaram metade dele, e quantos dias passaram sem nada sair da
 * conta. E a unica leitura do periodo em que o dia da semana aparece.
 *
 * Um bloco por mes, e nao uma faixa continua de semanas ao estilo do GitHub:
 * num recorte de mes unico — o caso comum do dashboard — a faixa daria cinco
 * colunas magras perdidas num cartao largo, enquanto a forma de calendario e
 * reconhecida de imediato e ocupa o espaco que tem.
 */
export function SpendingCalendar({ days, description }: SpendingCalendarProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const today = todayISO();
  const months = useMemo(() => groupByMonth(days), [days]);
  const scale = useMemo(() => buildScale(days), [days]);
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);

  /* Media e recordes olham so o que ja aconteceu: incluir os dias que ainda nao
     chegaram derrubaria a media de um mes em andamento pela metade. */
  const elapsed = useMemo(() => days.filter((day) => day.date <= today), [days, today]);
  const total = elapsed.reduce((sum, day) => sum + day.amount, 0);
  const average = elapsed.length > 0 ? total / elapsed.length : 0;
  const quietDays = elapsed.filter((day) => day.amount === 0).length;
  const heaviest = useMemo(() => heaviestWeekday(elapsed), [elapsed]);
  const peak = elapsed.reduce<DailySpending | null>(
    (best, day) => (day.amount > (best?.amount ?? 0) ? day : best),
    null,
  );

  /*
   * A leitura do dia so existe enquanto o ponteiro esta sobre uma casa: ela e um
   * refinamento de quem tem mouse, nao a unica via para o dado. O que ela diz de
   * mais importante — o maior gasto — esta escrito na coluna ao lado, em texto,
   * para quem chega por teclado, leitor de tela ou celular.
   */
  const focus = (hovered ? byDate.get(hovered) : null) ?? null;

  const summary = peak
    ? `Gastos por dia. Maior gasto em ${formatFullDate(peak.date)}: ${formatCurrency(peak.amount)}.`
    : 'Gastos por dia. Nenhuma despesa no período.';

  return (
    <Card>
      <CardHeader
        title="Gastos por dia"
        description={description}
        action={
          focus ? (
            <span className={styles.readout}>
              <span className={styles.readoutLabel}>{formatFullDate(focus.date)}</span>
              <Amount value={focus.amount} size="sm" tone={focus.amount > 0 ? 'negative' : 'muted'} />
            </span>
          ) : null
        }
      />

      <CardBody className={styles.body}>
        {/*
          A grade e uma imagem: trinta casas anunciadas uma a uma seriam ruido
          para quem usa leitor de tela. O que elas dizem em cor esta escrito ao
          lado, em texto — media, recorde e dias sem gasto.
        */}
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
                    key={day.date}
                    data-date={day.date}
                    className={cn(
                      styles.day,
                      styles[`level${levelOf(day.amount, scale)}`],
                      day.date > today && styles.ahead,
                      day.date === today && styles.today,
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
                <Amount value={peak?.amount ?? 0} size="sm" />
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

          {/* A escala e a legenda dela: sem isso a cor de uma casa nao diz nada. */}
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
