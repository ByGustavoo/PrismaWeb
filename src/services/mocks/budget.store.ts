import { ApiError } from '@/api';
import type { Budget, BudgetPayload } from '@/types';
import { budgets, categories } from './data';

let sequence = budgets.length;

function findIndexOrThrow(id: string): number {
  const index = budgets.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ApiError('Orçamento não encontrado.', 404, 'not_found');
  }
  return index;
}

/**
 * Uma categoria tem no maximo um limite. Dois limites para a mesma categoria
 * fariam a barra de consumo depender de qual deles a tela leu primeiro, e a
 * soma dos orcamentos contaria o mesmo gasto duas vezes.
 */
function resolve(payload: BudgetPayload, currentId?: string): Omit<Budget, 'id'> {
  const category = categories.find((item) => item.id === payload.categoryId);

  if (!category) {
    throw new ApiError('Escolha a categoria do orçamento.', 422, 'validation_error');
  }
  if (category.kind !== 'expense') {
    throw new ApiError('Só categorias de despesa aceitam orçamento.', 422, 'validation_error');
  }
  if (!Number.isFinite(payload.limit) || payload.limit <= 0) {
    throw new ApiError('Informe um limite maior que zero.', 422, 'validation_error');
  }

  const duplicated = budgets.some((item) => item.category.id === category.id && item.id !== currentId);
  if (duplicated) {
    throw new ApiError(
      `Já existe um orçamento para ${category.name}. Edite o limite existente em vez de criar outro.`,
      409,
      'conflict',
    );
  }

  return { category, limit: payload.limit };
}

export function createBudget(payload: BudgetPayload): Budget {
  sequence += 1;
  const created: Budget = { id: `bud-${sequence}`, ...resolve(payload) };
  budgets.push(created);
  return created;
}

export function updateBudget(id: string, payload: BudgetPayload): Budget {
  const index = findIndexOrThrow(id);
  const updated: Budget = { id, ...resolve(payload, id) };
  budgets[index] = updated;
  return updated;
}

export function deleteBudget(id: string): void {
  budgets.splice(findIndexOrThrow(id), 1);
}
