import { CURRENCY, LOCALE } from '@/constants/app';
import { fromISODate } from './date';

/** Simbolo usado quando o Intl nao devolve a parte de moeda. */
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

/** Espaco inquebravel entre o simbolo e os algarismos. */
const NBSP = ' ';

export interface CurrencyParts {
  /** Simbolo da moeda isolado, para receber estilo proprio. */
  symbol: string;
  /** Algarismos ja agrupados e com duas casas: "5.000,00". */
  digits: string;
}

/**
 * Separa "R$" dos algarismos. Simbolo e numeros usam familia e tracking
 * diferentes (ver .tabular no global.css); mante-los em spans distintos e o que
 * faz o cifrao aparecer igual, e alinhado, em todos os componentes.
 */
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

/** Versao curta para eixos de grafico: "R$ 12,4 mil". */
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
  return dayMonthFormatter.format(fromISODate(isoDate)).replace('.', '');
}

export function formatFullDate(isoDate: string): string {
  return fullDateFormatter.format(fromISODate(isoDate));
}

/** "2026-08" -> "agosto de 2026" */
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return monthYearFormatter.format(new Date(year ?? 1970, (monthNumber ?? 1) - 1, 1));
}

/**
 * Rotulo de um periodo de meses: "Agosto de 2026" quando e um mes so, "Maio a
 * Agosto de 2026" dentro do mesmo ano e "Novembro de 2025 a Marco de 2026"
 * quando atravessa a virada — repetir o ano nos dois lados so polui.
 *
 * Os dois meses saem com inicial maiuscula: no rotulo eles nomeiam o recorte, e
 * capitalizar so o primeiro fazia a segunda metade parecer descuido.
 */
export function formatPeriodLabel(from: string, to: string): string {
  const end = capitalize(formatMonthLabel(to));
  if (from === to) return end;

  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = sameYear ? formatMonthLabel(from).replace(/ de \d{4}$/, '') : formatMonthLabel(from);
  return `${capitalize(start)} a ${end}`;
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

/**
 * Le o valor digitado num campo de moeda. Aceita tanto "1.200,50" quanto
 * "1200.50": o usuario digita do jeito brasileiro, mas colar um numero cru
 * tambem precisa funcionar.
 */
export function parseAmountInput(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // Com virgula, o ponto e separador de milhar; sem virgula, o ponto e decimal.
  const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Numero -> texto do campo de moeda, sem simbolo: 1200.5 -> "1.200,50". */
export function toAmountInput(value: number): string {
  return amountInputFormatter.format(value);
}
