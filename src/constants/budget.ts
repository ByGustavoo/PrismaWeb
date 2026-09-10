import type { BadgeTone, ProgressTone } from '@/components/ui';
import type { BudgetStatus } from '@/types';

export const BUDGET_WARNING_RATIO = 0.8;
export const BUDGET_EXCEEDED_RATIO = 1;

export const BUDGET_PROJECTION_MIN_DAYS = 10;

export function budgetStatusOf(ratio: number): BudgetStatus {
  if (ratio >= BUDGET_EXCEEDED_RATIO) return 'ESTOURADO';
  if (ratio >= BUDGET_WARNING_RATIO) return 'ALERTA';
  return 'SEGURO';
}

export const budgetStatusLabel: Record<BudgetStatus, string> = {
  SEGURO: 'Dentro do limite',
  ALERTA: 'Perto do limite',
  ESTOURADO: 'Limite estourado',
};

export const budgetStatusTone: Record<BudgetStatus, BadgeTone> = {
  SEGURO: 'positive',
  ALERTA: 'warning',
  ESTOURADO: 'negative',
};

export const budgetProgressTone: Record<BudgetStatus, ProgressTone> = {
  SEGURO: 'accent',
  ALERTA: 'warning',
  ESTOURADO: 'negative',
};
