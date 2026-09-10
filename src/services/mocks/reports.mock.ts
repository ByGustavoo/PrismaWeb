import { REPORT_DAILY_BUCKET_MAX_DAYS, REPORT_WEEKLY_BUCKET_MAX_DAYS } from '@/constants/reports';
import type {
  PontoSaldo,
  PontoFluxo,
  NetWorthPoint,
  ReportRange,
  ReportSummary,
  SourceSpending,
  Lancamento,
} from '@/types';
import {
  addDays,
  daysBetween,
  fromISODate,
  monthKeyRange,
  monthsBetween,
  shiftMonthKey,
  toISODate,
} from '@/utils/date';
import { groupByCategory, percentDelta, shortMonthLabel, sumKind } from './aggregate';
import { balanceAt, monthClosingDate } from './balance';
import { transactions } from './data';
import { portfolioValueAt } from './investments.mock';

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function inRange(range: ReportRange): Lancamento[] {
  return transactions.filter((item) => item.data >= range.from && item.data <= range.to);
}

function previousRange(range: ReportRange): ReportRange {
  const length = daysBetween(range.from, range.to) + 1;
  const end = toISODate(addDays(fromISODate(range.from), -1));
  return { from: toISODate(addDays(fromISODate(end), -(length - 1))), to: end };
}

function dayLabel(dateISO: string): string {
  return `${dateISO.slice(8, 10)}/${dateISO.slice(5, 7)}`;
}

function buckets(range: ReportRange): Array<{ label: string; from: string; to: string }> {
  const days = daysBetween(range.from, range.to) + 1;

  if (days <= REPORT_DAILY_BUCKET_MAX_DAYS) {
    return Array.from({ length: days }, (_, index) => {
      const date = toISODate(addDays(fromISODate(range.from), index));
      return { label: dayLabel(date), from: date, to: date };
    });
  }

  if (days <= REPORT_WEEKLY_BUCKET_MAX_DAYS) {
    const result: Array<{ label: string; from: string; to: string }> = [];

    for (let cursor = range.from; cursor <= range.to; ) {
      const end = toISODate(addDays(fromISODate(cursor), 6));
      const to = end > range.to ? range.to : end;
      result.push({ label: dayLabel(cursor), from: cursor, to });
      cursor = toISODate(addDays(fromISODate(to), 1));
    }

    return result;
  }

  const months = monthsBetween(range.from.slice(0, 7), range.to.slice(0, 7));

  return Array.from({ length: months }, (_, index) => {
    const month = shiftMonthKey(range.from.slice(0, 7), index);
    const span = monthKeyRange(month);
    return {
      label: shortMonthLabel(month),
      from: span.from < range.from ? range.from : span.from,
      to: span.to > range.to ? range.to : span.to,
    };
  });
}

function buildCashflow(range: ReportRange): PontoFluxo[] {
  return buckets(range).map((bucket) => {
    const list = transactions.filter((item) => item.data >= bucket.from && item.data <= bucket.to);
    return {
      rotulo: bucket.label,
      receitas: sumKind(list, 'RECEITA'),
      despesas: sumKind(list, 'DESPESA'),
    };
  });
}

function buildBalanceHistory(range: ReportRange): PontoSaldo[] {
  return buckets(range).map((bucket) => ({ rotulo: bucket.label, saldo: balanceAt(bucket.to) }));
}

function buildBySource(list: Lancamento[]): SourceSpending[] {
  const expenses = list.filter((item) => item.tipo === 'DESPESA');
  const total = expenses.reduce((sum, item) => sum + item.valor, 0);
  const grouped = new Map<string, SourceSpending>();

  for (const item of expenses) {
    const existing = grouped.get(item.idOrigem);
    if (existing) {
      existing.amount += item.valor;
      continue;
    }

    grouped.set(item.idOrigem, {
      id: item.idOrigem,
      name: item.nomeOrigem,
      group: item.idOrigem.startsWith('card-') ? 'CARTAO' : 'CONTA',
      amount: item.valor,
      share: 0,
    });
  }

  return [...grouped.values()]
    .map((entry) => ({ ...entry, amount: money(entry.amount), share: total > 0 ? entry.amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

const SHORT_RANGE_WINDOW = 6;

function buildNetWorth(range: ReportRange): NetWorthPoint[] {
  const last = range.to.slice(0, 7);
  const span = monthsBetween(range.from.slice(0, 7), last);
  const length = Math.max(span, SHORT_RANGE_WINDOW);

  return Array.from({ length }, (_, index) => {
    const month = shiftMonthKey(last, index - (length - 1));
    const accountsValue = balanceAt(monthClosingDate(month));
    const investmentsValue = portfolioValueAt(month);

    return {
      month,
      label: shortMonthLabel(month),
      accounts: accountsValue,
      investments: investmentsValue,
      total: money(accountsValue + investmentsValue),
    };
  });
}

export function buildReportSummary(range: ReportRange): ReportSummary {
  const current = inRange(range);
  const comparison = inRange(previousRange(range));

  const income = money(sumKind(current, 'RECEITA'));
  const expense = money(sumKind(current, 'DESPESA'));

  return {
    from: range.from,
    to: range.to,
    income,
    expense,
    net: money(income - expense),
    incomeDelta: percentDelta(income, sumKind(comparison, 'RECEITA')),
    expenseDelta: percentDelta(expense, sumKind(comparison, 'DESPESA')),
    transactionCount: current.filter((item) => item.tipo !== 'TRANSFERENCIA').length,
    expenseByCategory: groupByCategory(current, 'DESPESA'),
    incomeByCategory: groupByCategory(current, 'RECEITA'),
    cashflow: buildCashflow(range),
    expenseBySource: buildBySource(current),
    balanceHistory: buildBalanceHistory(range),
    netWorth: buildNetWorth(range),
  };
}
