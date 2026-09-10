import { AMOUNT_MAX_DECIMALS, AMOUNT_MAX_INTEGER_DIGITS, TEXT_MIN_LENGTH } from '@/constants/validation';
import { parseAmountInput } from './format';

export function textLength(value: string): number {
  return value.trim().length;
}

interface TextRule {
  subject: string;
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

export function fitsAmountColumn(value: number): boolean {
  const factor = 10 ** AMOUNT_MAX_DECIMALS;
  return (
    Number.isFinite(value) &&
    Math.round(value * factor) / factor === value &&
    Math.abs(value) < 10 ** AMOUNT_MAX_INTEGER_DIGITS
  );
}

interface AmountRule {
  subject: string;
  missing: string;
  sign: 'positive' | 'non-negative' | 'any';
}

export function amountError(raw: string, { subject, missing, sign }: AmountRule): string | undefined {
  if (!raw.trim()) return missing;

  const value = parseAmountInput(raw);
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
