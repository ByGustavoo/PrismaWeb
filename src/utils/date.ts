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

/** Mes de referencia deslocado a partir de hoje. */
export function monthKeyFromOffset(offset: number, base: Date = new Date()): string {
  return toMonthKey(addMonths(base, offset));
}
