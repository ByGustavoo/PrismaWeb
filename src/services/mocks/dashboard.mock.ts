import { LOCALE } from '@/constants/app';
import type {
  BalancePoint,
  CashflowPoint,
  CategorySpending,
  DashboardSummary,
  Delta,
  Transaction,
} from '@/types';
import { accounts, currentMonth, investments, invoices, transactions } from './data';

const monthShort = new Intl.DateTimeFormat(LOCALE, { month: 'short' });

function lastMonthLabels(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return monthShort.format(date).replace('.', '');
  });
}

function delta(percentage: number): Delta {
  const trend = percentage > 0.05 ? 'up' : percentage < -0.05 ? 'down' : 'flat';
  return { percentage, trend };
}

function sumBy(list: Transaction[], predicate: (item: Transaction) => boolean): number {
  return list.filter(predicate).reduce((total, item) => total + item.amount, 0);
}

function buildSpendingByCategory(): CategorySpending[] {
  const expenses = transactions.filter((item) => item.kind === 'expense');
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const grouped = new Map<string, CategorySpending>();

  for (const item of expenses) {
    if (!item.category) continue;
    const existing = grouped.get(item.category.id);
    if (existing) {
      existing.amount += item.amount;
    } else {
      grouped.set(item.category.id, { category: item.category, amount: item.amount, share: 0 });
    }
  }

  return [...grouped.values()]
    .map((entry) => ({ ...entry, share: total > 0 ? entry.amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

function buildCashflow(income: number, expense: number): CashflowPoint[] {
  const labels = lastMonthLabels(6);
  // Variacoes fixas para manter o grafico estavel entre recarregamentos.
  const incomeFactors = [0.82, 0.9, 0.86, 1.04, 0.95, 1];
  const expenseFactors = [0.94, 1.08, 0.88, 1.12, 0.91, 1];

  return labels.map((label, index) => ({
    label,
    income: Math.round(income * (incomeFactors[index] ?? 1)),
    expense: Math.round(expense * (expenseFactors[index] ?? 1)),
  }));
}

function buildBalanceHistory(currentBalance: number): BalancePoint[] {
  const labels = lastMonthLabels(6);
  const factors = [0.78, 0.83, 0.87, 0.91, 0.96, 1];

  return labels.map((label, index) => ({
    label,
    balance: Math.round(currentBalance * (factors[index] ?? 1)),
  }));
}

export function buildDashboardSummary(): DashboardSummary {
  const currentBalance = accounts
    .filter((account) => account.includeInTotal)
    .reduce((total, account) => total + account.balance, 0);

  const monthIncome = sumBy(transactions, (item) => item.kind === 'income');
  const monthExpense = sumBy(transactions, (item) => item.kind === 'expense');
  const investmentsTotal = investments.reduce((total, item) => total + item.currentValue, 0);
  const investedTotal = investments.reduce((total, item) => total + item.invested, 0);

  const openInvoice = invoices.find((invoice) => invoice.status === 'open') ?? invoices[0];

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return {
    month: currentMonth,
    currentBalance,
    balanceDelta: delta(4.2),
    monthIncome,
    incomeDelta: delta(11.8),
    monthExpense,
    expenseDelta: delta(-3.4),
    investmentsTotal,
    investmentsDelta: delta(((investmentsTotal - investedTotal) / investedTotal) * 100),
    currentInvoice: {
      total: openInvoice?.total ?? 0,
      cardName: openInvoice?.cardName ?? '-',
      dueDate: openInvoice?.dueDate ?? currentMonth,
      status: openInvoice?.status ?? 'open',
    },
    balanceHistory: buildBalanceHistory(currentBalance),
    cashflow: buildCashflow(monthIncome, monthExpense),
    spendingByCategory: buildSpendingByCategory(),
    recentTransactions,
  };
}
