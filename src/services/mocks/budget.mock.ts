import { BUDGET_PROJECTION_MIN_DAYS, budgetStatusOf } from '@/constants/budget';
import type { BudgetOverview, BudgetUsage, GastoPorCategoria, Lancamento } from '@/types';
import { fromMonthKey, todayISO } from '@/utils/date';
import { groupByCategory } from './aggregate';
import { budgets, currentMonth, transactions } from './data';

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function expensesOfMonth(monthKey: string): Lancamento[] {
  return transactions.filter((item) => item.tipo === 'DESPESA' && item.data.startsWith(monthKey));
}

function elapsedDays(monthKey: string, daysInMonth: number): number {
  const today = todayISO();
  const thisMonth = today.slice(0, 7);

  if (monthKey < thisMonth) return daysInMonth;
  if (monthKey > thisMonth) return 0;
  return Number(today.slice(8, 10));
}

export function buildBudgetOverview(month: string = currentMonth): BudgetOverview {
  const expenses = expensesOfMonth(month);
  const start = fromMonthKey(month);
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const daysElapsed = elapsedDays(month, daysInMonth);
  const projects = daysElapsed >= BUDGET_PROJECTION_MIN_DAYS && daysElapsed < daysInMonth;

  const spentByCategory = new Map<string, number>();
  for (const item of expenses) {
    if (!item.categoria) continue;
    spentByCategory.set(item.categoria.id, (spentByCategory.get(item.categoria.id) ?? 0) + item.valor);
  }

  const items: BudgetUsage[] = budgets
    .map((budget) => {
      const spent = money(spentByCategory.get(budget.category.id) ?? 0);
      const ratio = budget.limit > 0 ? spent / budget.limit : 0;

      return {
        budget,
        spent,
        remaining: money(budget.limit - spent),
        ratio,
        projected: projects ? money((spent / daysElapsed) * daysInMonth) : spent,
        status: budgetStatusOf(ratio),
      };
    })
    .sort((a, b) => b.ratio - a.ratio);

  const planned = money(budgets.reduce((total, item) => total + item.limit, 0));
  const spent = money(items.reduce((total, item) => total + item.spent, 0));

  const budgetedIds = new Set(budgets.map((item) => item.category.id));
  const unplanned: GastoPorCategoria[] = groupByCategory(expenses, 'DESPESA').filter(
    (entry) => !budgetedIds.has(entry.categoria.id),
  );

  return {
    month,
    planned,
    spent,
    remaining: money(planned - spent),
    ratio: planned > 0 ? spent / planned : 0,
    daysLeft: Math.max(daysInMonth - daysElapsed, 0),
    daysElapsed,
    daysInMonth,
    items,
    unplanned,
  };
}
