import { ApiError } from '@/api';
import { textLimits } from '@/constants/validation';
import type { RecurringExpense, RecurringPayload } from '@/types';
import { fitsAmountColumn } from '@/utils/validation';
import { categories, findPaymentSource, recurringExpenses } from './data';

let sequence = recurringExpenses.length;

function findIndexOrThrow(id: string): number {
  const index = recurringExpenses.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ApiError('Despesa recorrente não encontrada.', 404, 'nao_encontrado');
  }
  return index;
}

function resolve(payload: RecurringPayload): Omit<RecurringExpense, 'id'> {
  if (payload.description.trim().length < 2) {
    throw new ApiError('Informe a descrição da despesa.', 422, 'erro_validacao');
  }
  if (payload.description.trim().length > textLimits.description) {
    throw new ApiError(`A descrição da despesa pode ter no máximo ${textLimits.description} caracteres.`, 422, 'erro_validacao');
  }
  if (!fitsAmountColumn(payload.amount) || payload.amount <= 0) {
    throw new ApiError('Informe um valor maior que zero.', 422, 'erro_validacao');
  }
  if ((payload.notes?.trim().length ?? 0) > textLimits.notes) {
    throw new ApiError(`A observação pode ter no máximo ${textLimits.notes} caracteres.`, 422, 'erro_validacao');
  }
  if (!payload.nextDueDate) {
    throw new ApiError('Informe a data do próximo vencimento.', 422, 'erro_validacao');
  }

  const source = findPaymentSource(payload.accountId);
  if (!source) {
    throw new ApiError('Escolha a conta ou o cartão que paga esta despesa.', 422, 'erro_validacao');
  }

  const category = categories.find((item) => item.id === payload.categoryId) ?? null;
  if (category && category.tipo !== 'DESPESA') {
    throw new ApiError('Escolha uma categoria de despesa.', 422, 'erro_validacao');
  }

  return {
    description: payload.description.trim(),
    amount: payload.amount,
    category,
    frequency: payload.frequency,
    nextDueDate: payload.nextDueDate,
    accountId: source.id,
    accountName: source.name,
    status: payload.status,
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
  };
}

export function createRecurringExpense(payload: RecurringPayload): RecurringExpense {
  sequence += 1;
  const created: RecurringExpense = { id: `rec-${sequence}`, ...resolve(payload) };
  recurringExpenses.unshift(created);
  return created;
}

export function updateRecurringExpense(id: string, payload: RecurringPayload): RecurringExpense {
  const index = findIndexOrThrow(id);
  const updated: RecurringExpense = { id, ...resolve(payload) };
  recurringExpenses[index] = updated;
  return updated;
}

export function deleteRecurringExpense(id: string): void {
  recurringExpenses.splice(findIndexOrThrow(id), 1);
}
