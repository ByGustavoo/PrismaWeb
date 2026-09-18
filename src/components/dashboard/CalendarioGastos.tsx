import { useMemo, useState } from 'react';
import { ValorMonetario } from '@/components/comum';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import type { GastoDiarioDTO } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { deDataISO, hojeISO } from '@/utils/data';
import { formatarMoeda, formatarDataCompleta, formatarMesCurto } from '@/utils/formatacao';
import styles from './CalendarioGastos.module.css';

interface CalendarioGastosProps {
  dias: GastoDiarioDTO[];
  descricao: string;
}

const DIAS_DA_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const NOMES_DIAS_DA_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const NIVEIS = [0, 1, 2, 3, 4];

interface BlocoMes {
  chave: string;
  deslocamento: number;
  dias: GastoDiarioDTO[];
}

interface EscalaCalor {
  q1: number;
  q2: number;
  q3: number;
}

function montarEscala(days: GastoDiarioDTO[]): EscalaCalor {
  const sorted = days
    .map((day) => day.valor)
    .filter((amount) => amount > 0)
    .sort((a, b) => a - b);

  const at = (ratio: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;

  return { q1: at(0.25), q2: at(0.5), q3: at(0.75) };
}

function nivelDe(amount: number, scale: EscalaCalor): number {
  if (amount <= 0) return 0;
  if (amount <= scale.q1) return 1;
  if (amount <= scale.q2) return 2;
  if (amount <= scale.q3) return 3;
  return 4;
}

function diaDaSemanaMaisPesado(days: GastoDiarioDTO[]): string | null {
  const totals = [0, 0, 0, 0, 0, 0, 0];

  for (const day of days) {
    const index = deDataISO(day.data).getDay();
    totals[index] = (totals[index] ?? 0) + day.valor;
  }

  let best = -1;
  totals.forEach((amount, index) => {
    if (amount > 0 && amount > (totals[best] ?? 0)) best = index;
  });

  return NOMES_DIAS_DA_SEMANA[best] ?? null;
}

function agruparPorMes(days: GastoDiarioDTO[]): BlocoMes[] {
  const grouped = new Map<string, GastoDiarioDTO[]>();

  for (const day of days) {
    const key = day.data.slice(0, 7);
    const list = grouped.get(key);
    if (list) list.push(day);
    else grouped.set(key, [day]);
  }

  return [...grouped.entries()].map(([key, list]) => ({
    chave: key,
    deslocamento: list[0] ? deDataISO(list[0].data).getDay() : 0,
    dias: list,
  }));
}

export function CalendarioGastos({ dias, descricao }: CalendarioGastosProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const today = hojeISO();
  const months = useMemo(() => agruparPorMes(dias), [dias]);
  const scale = useMemo(() => montarEscala(dias), [dias]);
  const byDate = useMemo(() => new Map(dias.map((day) => [day.data, day])), [dias]);

  const elapsed = useMemo(() => dias.filter((day) => day.data <= today), [dias, today]);
  const total = elapsed.reduce((sum, day) => sum + day.valor, 0);
  const average = elapsed.length > 0 ? total / elapsed.length : 0;
  const quietDays = elapsed.filter((day) => day.valor === 0).length;
  const heaviest = useMemo(() => diaDaSemanaMaisPesado(elapsed), [elapsed]);
  const peak = elapsed.reduce<GastoDiarioDTO | null>(
    (best, day) => (day.valor > (best?.valor ?? 0) ? day : best),
    null,
  );

  const focus = (hovered ? byDate.get(hovered) : null) ?? null;

  const summary = peak
    ? `Gastos por dia. Maior gasto em ${formatarDataCompleta(peak.data)}: ${formatarMoeda(peak.valor)}.`
    : 'Gastos por dia. Nenhuma despesa no período.';

  return (
    <Painel className="card-hover-accent">
      <CabecalhoPainel
        titulo="Gastos por dia"
        descricao={descricao}
        acao={
          focus ? (
            <span className={styles.readout}>
              <span className={styles.readoutLabel}>{formatarDataCompleta(focus.data)}</span>
              <ValorMonetario valor={focus.valor} tamanho="sm" tom={focus.valor > 0 ? 'negative' : 'muted'} />
            </span>
          ) : null
        }
      />

      <CorpoPainel className={styles.body}>
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
            <div key={month.chave} className={styles.month}>
              {months.length > 1 ? <span className={styles.monthName}>{formatarMesCurto(month.chave)}</span> : null}

              <div className={styles.weekdays} aria-hidden="true">
                {DIAS_DA_SEMANA.map((initial, index) => (
                  <span key={index}>{initial}</span>
                ))}
              </div>

              <div className={styles.grid}>
                {Array.from({ length: month.deslocamento }, (_, index) => (
                  <span key={`blank-${index}`} className={styles.blank} />
                ))}

                {month.dias.map((day) => (
                  <span
                    key={day.data}
                    data-date={day.data}
                    className={juntarClasses(
                      styles.day,
                      styles[`level${nivelDe(day.valor, scale)}`],
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
                <ValorMonetario valor={average} tamanho="sm" />
              </dd>
            </div>
            <div className={styles.stat}>
              <dt>Maior gasto num dia</dt>
              <dd>
                <ValorMonetario valor={peak?.valor ?? 0} tamanho="sm" />
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
            {NIVEIS.map((level) => (
              <span key={level} className={juntarClasses(styles.swatch, styles[`level${level}`])} />
            ))}
            <span>Mais</span>
          </div>
        </div>
      </CorpoPainel>
    </Painel>
  );
}
