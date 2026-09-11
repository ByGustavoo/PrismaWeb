import { CASAS_DECIMAIS_MAXIMAS_VALOR, DIGITOS_INTEIROS_MAXIMOS_VALOR, TAMANHO_MINIMO_TEXTO } from '@/constants/validacao';
import { interpretarEntradaValor } from './formatacao';

export function tamanhoTexto(value: string): number {
  return value.trim().length;
}

interface RegraTexto {
  sujeito: string;
  ausente?: string;
  maximo: number;
  minimo?: number;
}

export function erroTexto(value: string, { sujeito, ausente, maximo, minimo = TAMANHO_MINIMO_TEXTO }: RegraTexto): string | undefined {
  const length = tamanhoTexto(value);

  if (length === 0) return ausente;
  if (length > maximo) return `${sujeito} pode ter no máximo ${maximo} caracteres!`;
  if (ausente && length < minimo) return `${sujeito} precisa ter pelo menos ${minimo} caracteres!`;
  return undefined;
}

export function cabeNaColunaValor(value: number): boolean {
  const factor = 10 ** CASAS_DECIMAIS_MAXIMAS_VALOR;
  return (
    Number.isFinite(value) &&
    Math.round(value * factor) / factor === value &&
    Math.abs(value) < 10 ** DIGITOS_INTEIROS_MAXIMOS_VALOR
  );
}

interface RegraValor {
  sujeito: string;
  ausente: string;
  sinal: 'positive' | 'non-negative' | 'any';
}

export function erroValor(raw: string, { sujeito, ausente, sinal }: RegraValor): string | undefined {
  if (!raw.trim()) return ausente;

  const value = interpretarEntradaValor(raw);
  if (value === undefined) return `${sujeito} precisa ser um número, como 1.234,56!`;

  const factor = 10 ** CASAS_DECIMAIS_MAXIMAS_VALOR;
  if (Math.round(value * factor) / factor !== value) {
    return `${sujeito} pode ter no máximo ${CASAS_DECIMAIS_MAXIMAS_VALOR} casas decimais!`;
  }
  if (Math.abs(value) >= 10 ** DIGITOS_INTEIROS_MAXIMOS_VALOR) {
    return `${sujeito} pode ter no máximo ${DIGITOS_INTEIROS_MAXIMOS_VALOR} dígitos antes da vírgula!`;
  }
  if (sinal === 'positive' && value <= 0) return `${sujeito} precisa ser maior que zero!`;
  if (sinal === 'non-negative' && value < 0) return `${sujeito} não pode ser negativo!`;
  return undefined;
}
