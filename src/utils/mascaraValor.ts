import { CASAS_DECIMAIS_MAXIMAS_VALOR, DIGITOS_INTEIROS_MAXIMOS_VALOR } from '@/constants/validacao';

export interface ResultadoMascara {
  texto: string;
  cursor: number;
}

export interface EdicaoMonetaria {
  anterior: string;
  bruto: string;
  cursor: number;
  tipo?: string;
  permitirNegativo?: boolean;
}

export interface ColagemMonetaria {
  anterior: string;
  colado: string;
  inicio: number;
  fim: number;
  permitirNegativo?: boolean;
}

export const DIGITOS_MAXIMOS_ENTRADA_VALOR = DIGITOS_INTEIROS_MAXIMOS_VALOR + CASAS_DECIMAIS_MAXIMAS_VALOR;

const SEPARADOR_MILHAR = '.';
const SEPARADOR_DECIMAL = ',';
const SINAL_NEGATIVO = '-';

export function apenasDigitos(value: string): string {
  return value.replace(/\D/g, '');
}

function semZerosAEsquerda(digits: string): string {
  return digits.replace(/^0+/, '');
}

function contarSinais(value: string): number {
  return value.split(SINAL_NEGATIVO).length - 1;
}

function agruparMilhares(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, SEPARADOR_MILHAR);
}

export function formatarCentavos(digits: string, negativo = false): string {
  const padded = semZerosAEsquerda(apenasDigitos(digits)).padStart(CASAS_DECIMAIS_MAXIMAS_VALOR + 1, '0');
  const integer = padded.slice(0, -CASAS_DECIMAIS_MAXIMAS_VALOR);
  const cents = padded.slice(-CASAS_DECIMAIS_MAXIMAS_VALOR);
  const sign = negativo && /[1-9]/.test(padded) ? SINAL_NEGATIVO : '';
  return `${sign}${agruparMilhares(integer)}${SEPARADOR_DECIMAL}${cents}`;
}

function posicaoComDigitosADireita(texto: string, digitosADireita: number): number {
  const digitosADireitaVisiveis = Math.min(Math.max(digitosADireita, 0), apenasDigitos(texto).length);
  const digitosAEsquerda = apenasDigitos(texto).length - digitosADireitaVisiveis;
  if (digitosAEsquerda === 0) {
    const firstDigit = texto.search(/\d/);
    return firstDigit < 0 ? texto.length : firstDigit;
  }
  let seen = 0;
  for (let index = 0; index < texto.length; index += 1) {
    if (/\d/.test(texto.charAt(index))) seen += 1;
    if (seen === digitosAEsquerda) return index + 1;
  }
  return texto.length;
}

export function editarEntradaMonetaria({
  anterior,
  bruto,
  cursor,
  tipo = '',
  permitirNegativo = false,
}: EdicaoMonetaria): ResultadoMascara {
  const exclusao = tipo.startsWith('delete');
  const negativo = permitirNegativo && contarSinais(bruto) % 2 === 1;
  let left = apenasDigitos(bruto.slice(0, cursor));
  let right = apenasDigitos(bruto.slice(cursor));

  const soSeparadorApagado =
    exclusao &&
    bruto.length < anterior.length &&
    contarSinais(bruto) === contarSinais(anterior) &&
    left + right === apenasDigitos(anterior);
  if (soSeparadorApagado && tipo === 'deleteContentBackward') left = left.slice(0, -1);
  if (soSeparadorApagado && tipo === 'deleteContentForward') right = right.slice(1);

  const digits = semZerosAEsquerda(left + right);
  if (digits.length > DIGITOS_MAXIMOS_ENTRADA_VALOR) {
    const recuo = Math.max(bruto.length - anterior.length, 0);
    return { texto: anterior, cursor: Math.min(Math.max(cursor - recuo, 0), anterior.length) };
  }

  if (digits === '') {
    const zeroDigitado = !exclusao && left + right !== '';
    if (zeroDigitado) {
      const texto = `${negativo ? SINAL_NEGATIVO : ''}${formatarCentavos('0')}`;
      return { texto, cursor: texto.length };
    }
    return negativo ? { texto: SINAL_NEGATIVO, cursor: 1 } : { texto: '', cursor: 0 };
  }

  const texto = formatarCentavos(digits, negativo);
  return { texto, cursor: posicaoComDigitosADireita(texto, right.length) };
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

  const result =
    decimalIndex >= 0
      ? `${apenasDigitos(unsigned.slice(0, decimalIndex))}${SEPARADOR_DECIMAL}${apenasDigitos(unsigned.slice(decimalIndex + 1))}`
      : apenasDigitos(unsigned);

  return `${negative ? '-' : ''}${result}`;
}

export function centavosDoValorColado(text: string): string {
  const normalized = normalizarColagemMonetaria(text).replace(SINAL_NEGATIVO, '');
  const [integer = '', decimals = ''] = normalized.split(SEPARADOR_DECIMAL);
  if (!/\d/.test(integer + decimals)) return '';
  const cents = decimals.padEnd(CASAS_DECIMAIS_MAXIMAS_VALOR, '0').slice(0, CASAS_DECIMAIS_MAXIMAS_VALOR);
  return semZerosAEsquerda(`${integer}${cents}`) || '0';
}

function selecaoCobreTodosOsDigitos(texto: string, inicio: number, fim: number): boolean {
  const first = texto.search(/\d/);
  if (first < 0) return true;
  const last = texto.length - 1 - [...texto].reverse().join('').search(/\d/);
  return inicio <= first && fim > last;
}

export function colarEntradaMonetaria({
  anterior,
  colado,
  inicio,
  fim,
  permitirNegativo = false,
}: ColagemMonetaria): ResultadoMascara {
  const cents = centavosDoValorColado(colado);
  if (cents === '') return { texto: anterior, cursor: fim };

  if (selecaoCobreTodosOsDigitos(anterior, inicio, fim)) {
    if (cents.length > DIGITOS_MAXIMOS_ENTRADA_VALOR) return { texto: anterior, cursor: fim };
    const negativo = permitirNegativo && normalizarColagemMonetaria(colado).startsWith(SINAL_NEGATIVO);
    const texto = formatarCentavos(cents, negativo);
    return { texto, cursor: texto.length };
  }

  const inserted = apenasDigitos(colado);
  return editarEntradaMonetaria({
    anterior,
    bruto: `${anterior.slice(0, inicio)}${inserted}${anterior.slice(fim)}`,
    cursor: inicio + inserted.length,
    tipo: 'insertFromPaste',
    permitirNegativo,
  });
}
