import { MOEDA, LOCALIDADE } from '@/constants/aplicacao';
import { diasEntre, deDataISO, hojeISO } from './data';

const SIMBOLO_MOEDA = 'R$';

const formatadorMoeda = new Intl.NumberFormat(LOCALIDADE, {
  style: 'currency',
  currency: MOEDA,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatadorEntradaValor = new Intl.NumberFormat(LOCALIDADE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatadorCompacto = new Intl.NumberFormat(LOCALIDADE, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatadorDiaMes = new Intl.DateTimeFormat(LOCALIDADE, {
  day: '2-digit',
  month: 'short',
});

const formatadorDataCompleta = new Intl.DateTimeFormat(LOCALIDADE, {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const formatadorMesAno = new Intl.DateTimeFormat(LOCALIDADE, {
  month: 'long',
  year: 'numeric',
});

const formatadorMesCurto = new Intl.DateTimeFormat(LOCALIDADE, {
  month: 'short',
});

const formatadorDataNumerica = new Intl.DateTimeFormat(LOCALIDADE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatadorHora = new Intl.DateTimeFormat(LOCALIDADE, {
  hour: '2-digit',
  minute: '2-digit',
});

const ESPACO_INQUEBRAVEL = ' ';

export interface PartesMoeda {
  simbolo: string;
  algarismos: string;
}

export function formatarPartesMoeda(value: number): PartesMoeda {
  const parts = formatadorMoeda.formatToParts(value);
  const simbolo = parts.find((part) => part.type === 'currency')?.value ?? SIMBOLO_MOEDA;
  const algarismos = parts
    .filter((part) => part.type !== 'currency')
    .map((part) => part.value)
    .join('')
    .trim();

  return { simbolo, algarismos };
}

export function formatarMoeda(value: number): string {
  const { simbolo, algarismos } = formatarPartesMoeda(value);
  return simbolo + ESPACO_INQUEBRAVEL + algarismos;
}

export function formatarMoedaCompacta(value: number): string {
  return SIMBOLO_MOEDA + ESPACO_INQUEBRAVEL + formatadorCompacto.format(value);
}

export function formatarPercentual(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits).replace('.', ',')}%`;
}

export function formatarPercentualComSinal(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatarPercentual(value)}`;
}

export function formatarDataCurta(isoDate: string): string {
  const date = deDataISO(isoDate);
  const dayAndMonth = formatadorDiaMes
    .formatToParts(date)
    .map((part) => (part.type === 'month' ? capitalizar(part.value) : part.value))
    .join('')
    .replace('.', '');

  return date.getFullYear() === new Date().getFullYear() ? dayAndMonth : `${dayAndMonth} de ${date.getFullYear()}`;
}

export function formatarDataCompleta(isoDate: string): string {
  return formatadorDataCompleta.format(deDataISO(isoDate));
}

export function formatarDataNumerica(isoDate: string): string {
  return formatadorDataNumerica.format(deDataISO(isoDate));
}

export function formatarHora(value: Date = new Date()): string {
  return formatadorHora.format(value);
}

export function formatarRotuloMes(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return formatadorMesAno.format(new Date(year ?? 1970, (monthNumber ?? 1) - 1, 1));
}

export function formatarMesCurto(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const name = formatadorMesCurto.format(new Date(year ?? 1970, (monthNumber ?? 1) - 1, 1)).replace('.', '');
  return `${capitalizar(name)}/${year}`;
}

export function formatarRotuloPeriodo(from: string, to: string): string {
  const end = capitalizar(formatarRotuloMes(to));
  if (from === to) return end;

  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = sameYear ? formatarRotuloMes(from).replace(/ de \d{4}$/, '') : formatarRotuloMes(from);
  return `${capitalizar(start)} a ${end}`;
}

export function formatarRotuloVencimento(isoDate: string, reference: string = hojeISO()): string {
  const days = diasEntre(reference, isoDate);
  if (days < 0) {
    const past = Math.abs(days);
    return `venceu há ${past} ${past === 1 ? 'dia' : 'dias'}`;
  }
  if (days === 0) return 'vence hoje';
  if (days === 1) return 'vence amanhã';
  return `vence em ${days} dias`;
}

export function capitalizar(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const VALOR_BRASILEIRO = /^-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?$/;
const VALOR_DECIMAL_COM_PONTO = /^-?\d+\.\d+$/;

export function interpretarEntradaValor(raw: string): number | undefined {
  const trimmed = raw.trim();

  if (VALOR_BRASILEIRO.test(trimmed)) {
    return Number(trimmed.replace(/\./g, '').replace(',', '.'));
  }
  if (VALOR_DECIMAL_COM_PONTO.test(trimmed)) {
    return Number(trimmed);
  }
  return undefined;
}

export function paraEntradaValor(value: number): string {
  return formatadorEntradaValor.format(value);
}

export function normalizarBusca(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
