import { LOCALE } from '@/constants/app';
import type {
  BalancePoint,
  CashflowPoint,
  DailySpending,
  DashboardSummary,
  Transaction,
} from '@/types';
import {
  addDays,
  fromISODate,
  fromMonthKey,
  monthKeyRange,
  monthsBetween,
  shiftMonthKey,
  toISODate,
} from '@/utils/date';
import { groupByCategory, percentDelta, shortMonthLabel, sumKind } from './aggregate';
import { balanceAt, monthClosingDate } from './balance';
import { buildInvoices } from './cards.mock';
import { currentMonth, investments, transactions } from './data';

/** Recorte pedido pelo header: um mes so quando `from` e `to` sao iguais. */
export interface DashboardPeriod {
  from: string;
  to: string;
}

/**
 * Um mes sozinho nao conta historia nenhuma num grafico de linha, entao o
 * recorte de mes unico ganha os cinco meses anteriores como contexto. Um periodo
 * de varios meses ja e a propria janela: mostrar meses de fora confundiria.
 */
const SINGLE_MONTH_WINDOW = 6;

/** Os `count` meses que terminam em `monthKey`, do mais antigo ao mais recente. */
function monthWindow(monthKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => shiftMonthKey(monthKey, index - (count - 1)));
}

/** Meses desenhados nos graficos para o periodo escolhido. */
function chartWindow(period: DashboardPeriod): string[] {
  const length = monthsBetween(period.from, period.to);
  return monthWindow(period.to, length > 1 ? length : SINGLE_MONTH_WINDOW);
}

function inPeriod(period: DashboardPeriod): Transaction[] {
  const month = (item: Transaction) => item.date.slice(0, 7);
  return transactions.filter((item) => month(item) >= period.from && month(item) <= period.to);
}

function ofMonth(monthKey: string): Transaction[] {
  return transactions.filter((item) => item.date.startsWith(monthKey));
}

/** O periodo de mesmo tamanho imediatamente anterior, base das variacoes. */
function previousPeriod(period: DashboardPeriod): DashboardPeriod {
  const length = monthsBetween(period.from, period.to);
  return { from: shiftMonthKey(period.from, -length), to: shiftMonthKey(period.to, -length) };
}

/**
 * Um total de despesas para cada dia da janela desenhada — a mesma dos outros
 * graficos, entao um mes unico vem acompanhado dos cinco anteriores. Trinta
 * quadradinhos sozinhos nao mostram habito nenhum: e a repeticao de seis meses
 * que faz aparecer o dia da semana em que se gasta e a semana do mes que pesa.
 *
 * A serie e continua de proposito, com o dia sem gasto valendo zero: e o
 * calendario que decide como pintar o vazio e o dia que ainda nao chegou, e
 * para isso ele precisa de todas as casas.
 */
function buildDailySpending(window: string[]): DailySpending[] {
  const first = window[0];
  const last = window[window.length - 1];
  if (!first || !last) return [];

  const totals = new Map<string, number>();

  for (const item of transactions) {
    if (item.kind !== 'DESPESA') continue;
    const month = item.date.slice(0, 7);
    if (month < first || month > last) continue;
    totals.set(item.date, (totals.get(item.date) ?? 0) + item.amount);
  }

  const days: DailySpending[] = [];
  const end = fromISODate(monthKeyRange(last).to);

  for (let cursor = fromMonthKey(first); cursor <= end; cursor = addDays(cursor, 1)) {
    const date = toISODate(cursor);
    days.push({ date, amount: totals.get(date) ?? 0 });
  }

  return days;
}

function buildCashflow(window: string[]): CashflowPoint[] {
  return window.map((key) => {
    const list = ofMonth(key);
    return { label: shortMonthLabel(key), income: sumKind(list, 'RECEITA'), expense: sumKind(list, 'DESPESA') };
  });
}

function buildBalanceHistory(window: string[]): BalancePoint[] {
  return window.map((key) => ({ label: shortMonthLabel(key), balance: balanceAt(monthClosingDate(key)) }));
}

/**
 * Fatura em destaque no mes: a aberta, e na falta dela a de maior valor. O
 * cartao aparece nomeado no rodape do bloco, entao somar as faturas de todos os
 * cartoes daria um numero que nao corresponde a nenhum vencimento.
 */
function buildInvoice(monthKey: string): DashboardSummary['currentInvoice'] {
  const monthly = buildInvoices().filter((invoice) => invoice.month === monthKey);
  const open = monthly.filter((invoice) => invoice.status === 'ABERTA');
  const chosen = [...(open.length > 0 ? open : monthly)].sort((a, b) => b.total - a.total)[0];

  if (chosen) {
    return {
      total: chosen.total,
      cardName: chosen.cardName,
      dueDate: chosen.dueDate,
      status: chosen.status,
    };
  }

  // Mes sem nenhum cartao movimentado: o bloco mostra zero em vez de sumir.
  return {
    total: 0,
    cardName: 'Nenhum cartão',
    dueDate: monthKeyRange(shiftMonthKey(monthKey, 1)).to,
    status: monthKey < currentMonth ? 'PAGA' : 'ABERTA',
  };
}

/** Sem periodo, o mes corrente. */
export function buildDashboardSummary(
  period: DashboardPeriod = { from: currentMonth, to: currentMonth },
): DashboardSummary {
  const previous = previousPeriod(period);
  const current = inPeriod(period);
  const comparison = inPeriod(previous);

  const monthIncome = sumKind(current, 'RECEITA');
  const monthExpense = sumKind(current, 'DESPESA');
  const currentBalance = balanceAt(monthClosingDate(period.to));

  const investmentsTotal = investments.reduce((total, item) => total + item.currentValue, 0);
  const investedTotal = investments.reduce((total, item) => total + item.invested, 0);

  const recentTransactions = [...current]
    .sort((a, b) => b.date.localeCompare(a.date) || a.description.localeCompare(b.description, LOCALE))
    .slice(0, 6);

  const window = chartWindow(period);

  return {
    from: period.from,
    to: period.to,
    currentBalance,
    balanceDelta: percentDelta(currentBalance, balanceAt(monthClosingDate(previous.to))),
    monthIncome,
    incomeDelta: percentDelta(monthIncome, sumKind(comparison, 'RECEITA')),
    monthExpense,
    expenseDelta: percentDelta(monthExpense, sumKind(comparison, 'DESPESA')),
    investmentsTotal,
    investmentsDelta: percentDelta(investmentsTotal, investedTotal),
    currentInvoice: buildInvoice(period.to),
    balanceHistory: buildBalanceHistory(window),
    cashflow: buildCashflow(window),
    dailySpending: buildDailySpending(window),
    spendingByCategory: groupByCategory(current, 'DESPESA'),
    recentTransactions,
  };
}
