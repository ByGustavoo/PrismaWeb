export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function toISODate(date: Date): string {
  return `${toMonthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
}

export function fromISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function todayISO(base: Date = new Date()): string {
  return toISODate(base);
}

export function daysBetween(from: string, to: string): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((fromISODate(to).getTime() - fromISODate(from).getTime()) / MS_PER_DAY);
}

export function monthKeyFromOffset(offset: number, base: Date = new Date()): string {
  return toMonthKey(addMonths(base, offset));
}

export function monthRange(offset: number, base: Date = new Date()): { from: string; to: string } {
  return monthKeyRange(monthKeyFromOffset(offset, base));
}

export function lastDaysRange(days: number, base: Date = new Date()): { from: string; to: string } {
  return { from: toISODate(addDays(base, -(days - 1))), to: toISODate(base) };
}

export function yearRange(base: Date = new Date()): { from: string; to: string } {
  const year = base.getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function fromMonthKey(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, 1);
}

export function isMonthKey(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function shiftMonthKey(monthKey: string, amount: number): string {
  return toMonthKey(addMonths(fromMonthKey(monthKey), amount));
}

export function monthsBetween(from: string, to: string): number {
  const start = fromMonthKey(from);
  const end = fromMonthKey(to);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

export function monthKeyRange(monthKey: string): { from: string; to: string } {
  const start = fromMonthKey(monthKey);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { from: toISODate(start), to: toISODate(end) };
}
