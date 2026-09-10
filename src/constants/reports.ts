import type { Option } from '@/types';
import type { ReportRange } from '@/types';
import { addDays, addMonths, monthKeyRange, toISODate, toMonthKey } from '@/utils/date';

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

export function reportRangeOf(key: Exclude<ReportRangeKey, 'custom'>, base: Date = new Date()): ReportRange {
  const to = toISODate(base);

  if (key === 'week') return { from: toISODate(addDays(base, -6)), to };
  if (key === 'month') return { from: monthKeyRange(toMonthKey(base)).from, to };
  if (key === 'year') return { from: `${base.getFullYear()}-01-01`, to };

  const months = key === 'quarter' ? 2 : 5;
  return { from: monthKeyRange(toMonthKey(addMonths(base, -months))).from, to };
}

export const REPORT_DAILY_BUCKET_MAX_DAYS = 10;
export const REPORT_WEEKLY_BUCKET_MAX_DAYS = 45;
