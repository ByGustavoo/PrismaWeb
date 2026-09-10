import { CURRENCY, LOCALE } from '@/constants/app';
import { daysBetween, fromISODate, todayISO } from './date';

const CURRENCY_SYMBOL = 'R$';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const amountInputFormatter = new Intl.NumberFormat(LOCALE, {
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

const shortMonthFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
});

const numericDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
});

const NBSP = ' ';

export interface CurrencyParts {
  symbol: string;
  digits: string;
}

export function formatCurrencyParts(value: number): CurrencyParts {
  const parts = currencyFormatter.formatToParts(value);
  const symbol = parts.find((part) => part.type === 'currency')?.value ?? CURRENCY_SYMBOL;
  const digits = parts
    .filter((part) => part.type !== 'currency')
    .map((part) => part.value)
    .join('')
    .trim();

  return { symbol, digits };
}

export function formatCurrency(value: number): string {
  const { symbol, digits } = formatCurrencyParts(value);
  return symbol + NBSP + digits;
}

export function formatCompactCurrency(value: number): string {
  return CURRENCY_SYMBOL + NBSP + compactFormatter.format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits).replace('.', ',')}%`;
}

export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatPercent(value)}`;
}

export function formatShortDate(isoDate: string): string {
  return dayMonthFormatter
    .formatToParts(fromISODate(isoDate))
    .map((part) => (part.type === 'month' ? capitalize(part.value) : part.value))
    .join('')
    .replace('.', '');
}

export function formatFullDate(isoDate: string): string {
  return fullDateFormatter.format(fromISODate(isoDate));
}

export function formatNumericDate(isoDate: string): string {
  return numericDateFormatter.format(fromISODate(isoDate));
}

export function formatTime(value: Date = new Date()): string {
  return timeFormatter.format(value);
}

export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return monthYearFormatter.format(new Date(year ?? 1970, (monthNumber ?? 1) - 1, 1));
}

export function formatShortMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const name = shortMonthFormatter.format(new Date(year ?? 1970, (monthNumber ?? 1) - 1, 1)).replace('.', '');
  return `${capitalize(name)}/${year}`;
}

export function formatPeriodLabel(from: string, to: string): string {
  const end = capitalize(formatMonthLabel(to));
  if (from === to) return end;

  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = sameYear ? formatMonthLabel(from).replace(/ de \d{4}$/, '') : formatMonthLabel(from);
  return `${capitalize(start)} a ${end}`;
}

export function formatDueLabel(isoDate: string, reference: string = todayISO()): string {
  const days = daysBetween(reference, isoDate);
  if (days < 0) {
    const past = Math.abs(days);
    return `venceu há ${past} ${past === 1 ? 'dia' : 'dias'}`;
  }
  if (days === 0) return 'vence hoje';
  if (days === 1) return 'vence amanhã';
  return `vence em ${days} dias`;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

const BRAZILIAN_AMOUNT = /^-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?$/;
const DOT_DECIMAL_AMOUNT = /^-?\d+\.\d+$/;

export function parseAmountInput(raw: string): number | undefined {
  const trimmed = raw.trim();

  if (BRAZILIAN_AMOUNT.test(trimmed)) {
    return Number(trimmed.replace(/\./g, '').replace(',', '.'));
  }
  if (DOT_DECIMAL_AMOUNT.test(trimmed)) {
    return Number(trimmed);
  }
  return undefined;
}

export function toAmountInput(value: number): string {
  return amountInputFormatter.format(value);
}

export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
