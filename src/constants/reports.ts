import type { Option } from '@/types';
import type { ReportRange } from '@/types';
import { addDays, addMonths, monthKeyRange, toISODate, toMonthKey } from '@/utils/date';

/** Recortes oferecidos no filtro de relatorios. */
export type ReportRangeKey = 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'custom';

export const reportRangeLabel: Record<ReportRangeKey, string> = {
  week: 'Semana',
  month: 'Mês',
  quarter: '3 meses',
  semester: '6 meses',
  year: 'Ano',
  custom: 'Personalizado',
};

export const reportRangeKeys: ReportRangeKey[] = ['week', 'month', 'quarter', 'semester', 'year', 'custom'];

export const reportRangeOptions: Option<ReportRangeKey>[] = reportRangeKeys.map((key) => ({
  value: key,
  label: reportRangeLabel[key],
}));

/**
 * Datas de cada recorte. Todos terminam hoje, e nao no fim do mes ou do ano:
 * um relatorio que inclui dias que ainda nao aconteceram divide os totais por
 * um periodo maior do que o vivido e faz a media parecer menor do que e.
 *
 * `custom` nao tem calculo: quem escolhe o periodo proprio informa as duas
 * datas, e a tela parte do recorte anterior em vez de um intervalo vazio.
 */
export function reportRangeOf(key: Exclude<ReportRangeKey, 'custom'>, base: Date = new Date()): ReportRange {
  const to = toISODate(base);

  if (key === 'week') return { from: toISODate(addDays(base, -6)), to };
  if (key === 'month') return { from: monthKeyRange(toMonthKey(base)).from, to };
  if (key === 'year') return { from: `${base.getFullYear()}-01-01`, to };

  const months = key === 'quarter' ? 2 : 5;
  return { from: monthKeyRange(toMonthKey(addMonths(base, -months))).from, to };
}

/**
 * Como o grafico de entradas e saidas agrupa o periodo: por dia ate dez dias,
 * por semana ate quarenta e cinco, por mes acima disso. Os dois limites saem da
 * mesma regra — barras suficientes para desenhar uma forma, poucas o bastante
 * para os rotulos caberem. Uma semana em baldes semanais viraria uma barra
 * sozinha; um ano em baldes diarios, trezentas e sessenta.
 */
export const REPORT_DAILY_BUCKET_MAX_DAYS = 10;
export const REPORT_WEEKLY_BUCKET_MAX_DAYS = 45;
