import { AMOUNT_MAX_DECIMALS, AMOUNT_MAX_INTEGER_DIGITS, TEXT_MIN_LENGTH } from '@/constants/validation';
import { parseAmountInput } from './format';

/*
 * Regras de campo compartilhadas pelos formularios. As mensagens terminam em
 * exclamacao e nomeiam o campo: sao validacao local, e o erro vindo do servidor
 * (ponto final, em toast) e outra coisa.
 */

/** Tamanho que conta para o limite: o servidor grava o texto sem as bordas em branco. */
export function textLength(value: string): number {
  return value.trim().length;
}

interface TextRule {
  /** Sujeito da frase, com artigo: "O nome da conta", "A descrição da despesa". */
  subject: string;
  /** Mensagem do campo vazio. Ausente, o campo e opcional e nao tem minimo. */
  missing?: string;
  max: number;
  min?: number;
}

export function textError(value: string, { subject, missing, max, min = TEXT_MIN_LENGTH }: TextRule): string | undefined {
  const length = textLength(value);

  if (length === 0) return missing;
  if (length > max) return `${subject} pode ter no máximo ${max} caracteres!`;
  if (missing && length < min) return `${subject} precisa ter pelo menos ${min} caracteres!`;
  return undefined;
}

/** Valor que cabe numa coluna NUMERIC(14,2) sem ser arredondado nem estourar. */
export function fitsAmountColumn(value: number): boolean {
  const factor = 10 ** AMOUNT_MAX_DECIMALS;
  return (
    Number.isFinite(value) &&
    Math.round(value * factor) / factor === value &&
    Math.abs(value) < 10 ** AMOUNT_MAX_INTEGER_DIGITS
  );
}

interface AmountRule {
  /** Sujeito da frase, com artigo: "O valor da despesa". */
  subject: string;
  /** Mensagem do campo vazio. */
  missing: string;
  /** Saldo de conta pode ser negativo; saldo de vale nao; valor de lancamento nem zero. */
  sign: 'positive' | 'non-negative' | 'any';
}

export function amountError(raw: string, { subject, missing, sign }: AmountRule): string | undefined {
  if (!raw.trim()) return missing;

  const value = parseAmountInput(raw);
  // "Informe o valor" para quem digitou "12abc" soaria como se o campo estivesse vazio.
  if (value === undefined) return `${subject} precisa ser um número, como 1.234,56!`;

  const factor = 10 ** AMOUNT_MAX_DECIMALS;
  if (Math.round(value * factor) / factor !== value) {
    return `${subject} pode ter no máximo ${AMOUNT_MAX_DECIMALS} casas decimais!`;
  }
  if (Math.abs(value) >= 10 ** AMOUNT_MAX_INTEGER_DIGITS) {
    return `${subject} pode ter no máximo ${AMOUNT_MAX_INTEGER_DIGITS} dígitos antes da vírgula!`;
  }
  if (sign === 'positive' && value <= 0) return `${subject} precisa ser maior que zero!`;
  if (sign === 'non-negative' && value < 0) return `${subject} não pode ser negativo!`;
  return undefined;
}
