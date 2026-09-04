import { BUDGET_PROJECTION_MIN_DAYS, budgetStatusOf } from '@/constants/budget';
import type { BudgetOverview, BudgetUsage, CategorySpending, Transaction } from '@/types';
import { fromMonthKey, todayISO } from '@/utils/date';
import { groupByCategory } from './aggregate';
import { budgets, currentMonth, transactions } from './data';

/**
 * O orcamento nao guarda gasto: ele guarda o limite. O consumo sai das despesas
 * do mes pedido, exatamente como as faturas saem das compras — assim um
 * lancamento cadastrado agora move a barra na mesma hora, sem nenhum ajuste.
 */

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function expensesOfMonth(monthKey: string): Transaction[] {
  return transactions.filter((item) => item.kind === 'expense' && item.date.startsWith(monthKey));
}

/**
 * Dias ja vividos do mes. Num mes passado o mes inteiro conta; num mes futuro,
 * nenhum dia. E o denominador da projecao de ritmo, e por isso nunca pode ser
 * zero num mes que ja comecou.
 */
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
  // Ver BUDGET_PROJECTION_MIN_DAYS: projetar o inicio do mes por regra de tres
  // multiplica despesas que acontecem uma vez so, e mente mais do que informa.
  const projects = daysElapsed >= BUDGET_PROJECTION_MIN_DAYS && daysElapsed < daysInMonth;

  const spentByCategory = new Map<string, number>();
  for (const item of expenses) {
    if (!item.category) continue;
    spentByCategory.set(item.category.id, (spentByCategory.get(item.category.id) ?? 0) + item.amount);
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
    // Estouro primeiro, depois o que esta perto do limite: a tela abre no que
    // exige decisao, nao na ordem em que os limites foram cadastrados.
    .sort((a, b) => b.ratio - a.ratio);

  const planned = money(budgets.reduce((total, item) => total + item.limit, 0));
  const spent = money(items.reduce((total, item) => total + item.spent, 0));

  const budgetedIds = new Set(budgets.map((item) => item.category.id));
  const unplanned: CategorySpending[] = groupByCategory(expenses, 'expense').filter(
    (entry) => !budgetedIds.has(entry.category.id),
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
