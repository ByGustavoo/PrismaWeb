import { CASAS_DECIMAIS_MAXIMAS_VALOR } from '@/constants/validacao';

export interface ResultadoMascara {
  texto: string;
  cursor: number;
}

interface OpcoesMascara {
  permitirNegativo?: boolean;
}

const SEPARADOR_MILHAR = '.';
const SEPARADOR_DECIMAL = ',';

function significativo(char: string): boolean {
  return (char >= '0' && char <= '9') || char === SEPARADOR_DECIMAL;
}

function posicaoAposSignificativos(text: string, count: number): number {
  if (count <= 0) {
    const firstDigit = text.search(/[\d,]/);
    return firstDigit < 0 ? text.length : firstDigit;
  }
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (significativo(text.charAt(index))) seen += 1;
    if (seen === count) return index + 1;
  }
  return text.length;
}

function agruparMilhares(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, SEPARADOR_MILHAR);
}

export function formatarEntradaMonetaria(
  raw: string,
  cursor: number,
  { permitirNegativo = false }: OpcoesMascara = {},
): ResultadoMascara {
  const negative = permitirNegativo && raw.trim().startsWith('-');
  const kept = raw.replace(/[^\d,]/g, '');
  const keptBefore = raw.slice(0, cursor).replace(/[^\d,]/g, '').length;

  const commaIndex = kept.indexOf(SEPARADOR_DECIMAL);
  const hasComma = commaIndex >= 0;
  let integerPart = hasComma ? kept.slice(0, commaIndex) : kept;
  const decimalPart = hasComma ? kept.slice(commaIndex + 1).replace(/,/g, '').slice(0, CASAS_DECIMAIS_MAXIMAS_VALOR) : '';

  const leadingZeros = integerPart.length - integerPart.replace(/^0+/, '').length;
  integerPart = integerPart.replace(/^0+/, '');
  if (integerPart === '' && (hasComma || leadingZeros > 0)) integerPart = '0';
  const removedBeforeCursor = Math.max(Math.min(leadingZeros, keptBefore) - (integerPart === '0' ? 1 : 0), 0);

  if (!integerPart && !hasComma) {
    return { texto: negative ? '-' : '', cursor: negative ? 1 : 0 };
  }

  const texto = `${negative ? '-' : ''}${agruparMilhares(integerPart)}${hasComma ? SEPARADOR_DECIMAL + decimalPart : ''}`;
  const target = Math.max(keptBefore - removedBeforeCursor, 0);

  return { texto, cursor: Math.min(posicaoAposSignificativos(texto, target), texto.length) };
}

export function completarEntradaMonetaria(value: string): string {
  if (!/\d/.test(value)) return '';
  const [integerPart = '', decimalPart] = value.split(SEPARADOR_DECIMAL);
  const integer = integerPart === '' || integerPart === '-' ? `${integerPart}0` : integerPart;
  return `${integer}${SEPARADOR_DECIMAL}${(decimalPart ?? '').padEnd(CASAS_DECIMAIS_MAXIMAS_VALOR, '0')}`;
}

export function normalizarColagemMonetaria(text: string): string {
  const cleaned = text.replace(/[^\d,.-]/g, '');
  const negative = cleaned.startsWith('-');
  const unsigned = cleaned.replace(/-/g, '');
  const lastComma = unsigned.lastIndexOf(',');
  const lastDot = unsigned.lastIndexOf('.');

  let decimalIndex = -1;
  if (lastComma >= 0 && lastDot >= 0) {
    decimalIndex = Math.max(lastComma, lastDot);
  } else if (lastComma >= 0) {
    decimalIndex = unsigned.indexOf(',') === lastComma ? lastComma : -1;
  } else if (lastDot >= 0) {
    const onlyOneDot = unsigned.indexOf('.') === lastDot;
    const decimals = unsigned.length - lastDot - 1;
    decimalIndex = onlyOneDot && decimals > 0 && decimals <= CASAS_DECIMAIS_MAXIMAS_VALOR ? lastDot : -1;
  }

  const digitsOnly = (part: string) => part.replace(/\D/g, '');
  const result =
    decimalIndex >= 0
      ? `${digitsOnly(unsigned.slice(0, decimalIndex))}${SEPARADOR_DECIMAL}${digitsOnly(unsigned.slice(decimalIndex + 1))}`
      : digitsOnly(unsigned);

  return `${negative ? '-' : ''}${result}`;
}

export function apenasDigitos(value: string): string {
  return value.replace(/\D/g, '');
}
