import { ApiError } from '@/api';
import { textLimits } from '@/constants/validation';
import type { Investment, InvestmentPayload } from '@/types';
import { todayISO } from '@/utils/date';
import { fitsAmountColumn } from '@/utils/validation';
import { investments } from './data';

let sequence = investments.length;

function findIndexOrThrow(id: string): number {
  const index = investments.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ApiError('Investimento não encontrado.', 404, 'nao_encontrado');
  }
  return index;
}

function resolve(payload: InvestmentPayload): Omit<Investment, 'id'> {
  if (payload.name.trim().length < 2) {
    throw new ApiError('Informe o nome do investimento.', 422, 'erro_validacao');
  }
  if (payload.name.trim().length > textLimits.investmentName) {
    throw new ApiError(
      `O nome do investimento pode ter no máximo ${textLimits.investmentName} caracteres.`,
      422,
      'erro_validacao',
    );
  }
  if (payload.institution.trim().length < 2) {
    throw new ApiError('Informe a instituição onde o dinheiro está aplicado.', 422, 'erro_validacao');
  }
  if (payload.institution.trim().length > textLimits.institution) {
    throw new ApiError(`O nome da instituição pode ter no máximo ${textLimits.institution} caracteres.`, 422, 'erro_validacao');
  }
  if (!fitsAmountColumn(payload.invested) || payload.invested <= 0) {
    throw new ApiError('Informe quanto já foi aportado.', 422, 'erro_validacao');
  }
  if (!fitsAmountColumn(payload.currentValue) || payload.currentValue < 0) {
    throw new ApiError('Informe quanto a posição vale hoje.', 422, 'erro_validacao');
  }
  if ((payload.notes?.trim().length ?? 0) > textLimits.notes) {
    throw new ApiError(`A observação pode ter no máximo ${textLimits.notes} caracteres.`, 422, 'erro_validacao');
  }
  if (!payload.startDate) {
    throw new ApiError('Informe a data do primeiro aporte.', 422, 'erro_validacao');
  }
  if (payload.startDate > todayISO()) {
    throw new ApiError('A data do primeiro aporte não pode estar no futuro.', 422, 'erro_validacao');
  }

  return {
    name: payload.name.trim(),
    assetClass: payload.assetClass,
    institution: payload.institution.trim(),
    invested: payload.invested,
    currentValue: payload.currentValue,
    startDate: payload.startDate,
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
  };
}

export function createInvestment(payload: InvestmentPayload): Investment {
  sequence += 1;
  const created: Investment = { id: `inv-${sequence}`, ...resolve(payload) };
  investments.unshift(created);
  return created;
}

export function updateInvestment(id: string, payload: InvestmentPayload): Investment {
  const index = findIndexOrThrow(id);
  const updated: Investment = { id, ...resolve(payload) };
  investments[index] = updated;
  return updated;
}

export function deleteInvestment(id: string): void {
  investments.splice(findIndexOrThrow(id), 1);
}
