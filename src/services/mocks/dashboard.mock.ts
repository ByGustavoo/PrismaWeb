import { LOCALE } from '@/constants/app';
import type {
  BalancePoint,
  CashflowPoint,
  CategorySpending,
  DailySpending,
  DashboardSummary,
  Delta,
  Transaction,
  TransactionKind,
} from '@/types';
import {
  addDays,
  fromISODate,
  fromMonthKey,
  monthKeyRange,
  monthsBetween,
  shiftMonthKey,
  toISODate,
  todayISO,
} from '@/utils/date';
import { buildInvoices } from './cards.mock';
import { accounts, currentMonth, investments, transactions } from './data';

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

const monthShort = new Intl.DateTimeFormat(LOCALE, { month: 'short' });

function shortLabel(monthKey: string): string {
  return monthShort.format(fromMonthKey(monthKey)).replace('.', '');
}

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

function sumKind(list: Transaction[], kind: TransactionKind): number {
  return list.reduce((total, item) => (item.kind === kind ? total + item.amount : total), 0);
}

/** Variacao percentual entre dois periodos. Sem base de comparacao nao ha variacao. */
function percentDelta(current: number, previous: number): Delta {
  if (previous === 0) return { percentage: 0, trend: 'flat' };

  const percentage = ((current - previous) / previous) * 100;
  return { percentage, trend: percentage > 0.05 ? 'up' : percentage < -0.05 ? 'down' : 'flat' };
}

/**
 * Contas que compoem o patrimonio visivel. Sao funcoes, e nao constantes de
 * modulo, porque o cadastro de contas muda em tempo de execucao: uma conta
 * criada agora precisa entrar no saldo do dashboard sem recarregar a pagina.
 */
function includedAccountIds(): Set<string> {
  return new Set(
    accounts
      .filter((account) => account.status === 'active' && account.includeInTotal)
      .map((account) => account.id),
  );
}

function totalBalance(): number {
  return accounts
    .filter((account) => account.status === 'active' && account.includeInTotal)
    .reduce((total, account) => total + account.balance, 0);
}

/**
 * Efeito de um lancamento no saldo somado das contas que entram no total.
 * Receita e despesa entram inteiras — o mock nao tem pagamento de fatura, entao
 * tratar a despesa de cartao como neutra faria o dinheiro gasto sumir. Ja a
 * transferencia so conta quando cruza a fronteira do total: o aporte na
 * corretora, que fica de fora, reduz o saldo visivel, enquanto uma transferencia
 * entre duas contas do total nao muda nada.
 */
function balanceEffect(item: Transaction, included: Set<string>): number {
  if (item.kind === 'income') return item.amount;
  if (item.kind === 'expense') return -item.amount;

  const leaves = included.has(item.accountId);
  const enters = item.toAccountId ? included.has(item.toAccountId) : false;
  if (leaves === enters) return 0;
  return leaves ? -item.amount : item.amount;
}

/**
 * Saldo no fim do dia `dateISO`. Os saldos em `data.ts` sao os de hoje, entao o
 * passado se reconstroi desfazendo o que entrou e saiu depois da data, e o
 * futuro somando o que ainda vai acontecer.
 */
function balanceAt(dateISO: string): number {
  const reference = todayISO();
  const ahead = dateISO >= reference;
  const from = ahead ? reference : dateISO;
  const to = ahead ? dateISO : reference;
  const included = includedAccountIds();

  const net = transactions.reduce(
    (sum, item) => (item.date > from && item.date <= to ? sum + balanceEffect(item, included) : sum),
    0,
  );

  return Math.round((totalBalance() + (ahead ? net : -net)) * 100) / 100;
}

/**
 * Ultimo dia do mes, limitado a hoje: o saldo de um mes em andamento e o de
 * agora, nao uma projecao do que ainda vai cair ate o dia 31.
 */
function closingDate(monthKey: string): string {
  const { to } = monthKeyRange(monthKey);
  const reference = todayISO();
  return monthKey === reference.slice(0, 7) && to > reference ? reference : to;
}

function buildSpendingByCategory(list: Transaction[]): CategorySpending[] {
  const expenses = list.filter((item) => item.kind === 'expense');
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
    if (item.kind !== 'expense') continue;
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
    return { label: shortLabel(key), income: sumKind(list, 'income'), expense: sumKind(list, 'expense') };
  });
}

function buildBalanceHistory(window: string[]): BalancePoint[] {
  return window.map((key) => ({ label: shortLabel(key), balance: balanceAt(closingDate(key)) }));
}

/**
 * Fatura em destaque no mes: a aberta, e na falta dela a de maior valor. O
 * cartao aparece nomeado no rodape do bloco, entao somar as faturas de todos os
 * cartoes daria um numero que nao corresponde a nenhum vencimento.
 */
function buildInvoice(monthKey: string): DashboardSummary['currentInvoice'] {
  const monthly = buildInvoices().filter((invoice) => invoice.month === monthKey);
  const open = monthly.filter((invoice) => invoice.status === 'open');
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
    status: monthKey < currentMonth ? 'paid' : 'open',
  };
}

/** Sem periodo, o mes corrente. */
export function buildDashboardSummary(
  period: DashboardPeriod = { from: currentMonth, to: currentMonth },
): DashboardSummary {
  const previous = previousPeriod(period);
  const current = inPeriod(period);
  const comparison = inPeriod(previous);

  const monthIncome = sumKind(current, 'income');
  const monthExpense = sumKind(current, 'expense');
  const currentBalance = balanceAt(closingDate(period.to));

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
    balanceDelta: percentDelta(currentBalance, balanceAt(closingDate(previous.to))),
    monthIncome,
    incomeDelta: percentDelta(monthIncome, sumKind(comparison, 'income')),
    monthExpense,
    expenseDelta: percentDelta(monthExpense, sumKind(comparison, 'expense')),
    investmentsTotal,
    investmentsDelta: percentDelta(investmentsTotal, investedTotal),
    currentInvoice: buildInvoice(period.to),
    balanceHistory: buildBalanceHistory(window),
    cashflow: buildCashflow(window),
    dailySpending: buildDailySpending(window),
    spendingByCategory: buildSpendingByCategory(current),
    recentTransactions,
  };
}
