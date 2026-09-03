import { LOCALE } from '@/constants/app';
import type {
  BalancePoint,
  CashflowPoint,
  CategorySpending,
  DashboardSummary,
  Delta,
  Transaction,
  TransactionKind,
} from '@/types';
import { fromMonthKey, monthKeyRange, monthsBetween, shiftMonthKey, todayISO } from '@/utils/date';
import { accounts, creditCards, currentMonth, investments, invoices, transactions } from './data';

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

const includedAccounts = new Set(
  accounts.filter((account) => account.includeInTotal).map((account) => account.id),
);

const totalBalance = accounts
  .filter((account) => account.includeInTotal)
  .reduce((total, account) => total + account.balance, 0);

/**
 * Efeito de um lancamento no saldo somado das contas que entram no total.
 * Receita e despesa entram inteiras — o mock nao tem pagamento de fatura, entao
 * tratar a despesa de cartao como neutra faria o dinheiro gasto sumir. Ja a
 * transferencia so conta quando cruza a fronteira do total: o aporte na
 * corretora, que fica de fora, reduz o saldo visivel, enquanto uma transferencia
 * entre duas contas do total nao muda nada.
 */
function balanceEffect(item: Transaction): number {
  if (item.kind === 'income') return item.amount;
  if (item.kind === 'expense') return -item.amount;

  const leaves = includedAccounts.has(item.accountId);
  const enters = item.toAccountId ? includedAccounts.has(item.toAccountId) : false;
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

  const net = transactions.reduce(
    (sum, item) => (item.date > from && item.date <= to ? sum + balanceEffect(item) : sum),
    0,
  );

  return Math.round((totalBalance + (ahead ? net : -net)) * 100) / 100;
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
 * Fatura do ultimo mes do periodo. Quando nao existe uma cadastrada — o mock so
 * guarda as recentes — ela e deduzida das despesas de cartao daquele mes, para
 * que o card nao fique vazio ao navegar para tras.
 */
function buildInvoice(monthKey: string): DashboardSummary['currentInvoice'] {
  const registered =
    invoices.find((invoice) => invoice.month === monthKey && invoice.status === 'open') ??
    invoices.find((invoice) => invoice.month === monthKey);

  if (registered) {
    return {
      total: registered.total,
      cardName: registered.cardName,
      dueDate: registered.dueDate,
      status: registered.status,
    };
  }

  const byCard = new Map<string, number>();
  for (const item of ofMonth(monthKey)) {
    if (item.kind !== 'expense' || item.method !== 'credit-card') continue;
    byCard.set(item.accountId, (byCard.get(item.accountId) ?? 0) + item.amount);
  }

  const [cardId, total] = [...byCard.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  const card = creditCards.find((item) => item.id === cardId);
  const nextMonth = shiftMonthKey(monthKey, 1);
  const dueDay = card ? String(card.dueDay).padStart(2, '0') : monthKeyRange(nextMonth).to.slice(-2);

  return {
    total: Math.round((total ?? 0) * 100) / 100,
    cardName: card?.name ?? '-',
    dueDate: `${nextMonth}-${dueDay}`,
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
    spendingByCategory: buildSpendingByCategory(current),
    recentTransactions,
  };
}
