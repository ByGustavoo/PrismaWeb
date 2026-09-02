import { CURRENCY, LOCALE } from '@/constants/app';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const dayMonthFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
});

const fullDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const monthYearFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
});

/** Converte "2026-08-15" em Date local, sem deslocamento de fuso. */
function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** Versao curta para eixos de grafico: R$ 12,4 mil. */
export function formatCompactCurrency(value: number): string {
  return `R$ ${compactFormatter.format(value)}`;
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits).replace('.', ',')}%`;
}

export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatPercent(value)}`;
}

export function formatShortDate(isoDate: string): string {
  return dayMonthFormatter.format(parseISODate(isoDate)).replace('.', '');
}

export function formatFullDate(isoDate: string): string {
  return fullDateFormatter.format(parseISODate(isoDate));
}

/** "2026-08" -> "agosto de 2026" */
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return monthYearFormatter.format(new Date(year ?? 1970, (monthNumber ?? 1) - 1, 1));
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Iniciais para avatar: "Ana Ribeiro" -> "AR" */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
