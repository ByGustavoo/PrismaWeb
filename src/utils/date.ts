/** Utilitarios de data usados em toda a aplicacao (mocks, filtros e header). */

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

/** Date -> "YYYY-MM" */
export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Date -> "YYYY-MM-DD" sem deslocamento de fuso. */
export function toISODate(date: Date): string {
  return `${toMonthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
}

/** "2026-09-03" -> Date local, sem deslocamento de fuso. */
export function fromISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Data ISO de hoje. */
export function todayISO(base: Date = new Date()): string {
  return toISODate(base);
}

/** Dias inteiros de `from` ate `to`; negativo quando `to` ja passou. */
export function daysBetween(from: string, to: string): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((fromISODate(to).getTime() - fromISODate(from).getTime()) / MS_PER_DAY);
}

/** Mes de referencia deslocado a partir de hoje. */
export function monthKeyFromOffset(offset: number, base: Date = new Date()): string {
  return toMonthKey(addMonths(base, offset));
}
