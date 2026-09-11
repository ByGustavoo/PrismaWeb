export function somarMeses(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function somarDias(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function paraChaveMes(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function paraDataISO(date: Date): string {
  return `${paraChaveMes(date)}-${String(date.getDate()).padStart(2, '0')}`;
}

export function deDataISO(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function hojeISO(base: Date = new Date()): string {
  return paraDataISO(base);
}

export function diasEntre(from: string, to: string): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((deDataISO(to).getTime() - deDataISO(from).getTime()) / MS_PER_DAY);
}

export function chaveMesPorDeslocamento(offset: number, base: Date = new Date()): string {
  return paraChaveMes(somarMeses(base, offset));
}

export function periodoDoMes(offset: number, base: Date = new Date()): { from: string; to: string } {
  return periodoDaChaveMes(chaveMesPorDeslocamento(offset, base));
}

export function periodoUltimosDias(days: number, base: Date = new Date()): { from: string; to: string } {
  return { from: paraDataISO(somarDias(base, -(days - 1))), to: paraDataISO(base) };
}

export function periodoDoAno(base: Date = new Date()): { from: string; to: string } {
  const year = base.getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function deChaveMes(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, 1);
}

export function ehChaveMes(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function deslocarChaveMes(monthKey: string, amount: number): string {
  return paraChaveMes(somarMeses(deChaveMes(monthKey), amount));
}

export function mesesEntre(from: string, to: string): number {
  const start = deChaveMes(from);
  const end = deChaveMes(to);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

export function periodoDaChaveMes(monthKey: string): { from: string; to: string } {
  const start = deChaveMes(monthKey);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { from: paraDataISO(start), to: paraDataISO(end) };
}
