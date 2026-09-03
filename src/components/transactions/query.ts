import { LOCALE } from '@/constants/app';
import { transactionStatusLabel } from '@/constants/transactions';
import type { Option, Transaction } from '@/types';
import { lastDaysRange, monthRange, yearRange } from '@/utils/date';

/** Valor usado por todo filtro para "sem restricao". */
export const ALL = 'all';

export type PeriodPreset =
  | typeof ALL
  | 'this-month'
  | 'last-month'
  | 'last-30'
  | 'last-90'
  | 'this-year'
  | 'custom';

export type SortDirection = 'asc' | 'desc';
export type SortField = 'date' | 'description' | 'amount';

/**
 * Direcao inicial de cada coluna. Data e valor comecam do maior — o lancamento
 * mais recente e o mais caro sao o que se procura primeiro — e texto comeca de A.
 */
export const initialSortDirection: Record<SortField, SortDirection> = {
  date: 'desc',
  description: 'asc',
  amount: 'desc',
};

export interface TransactionQuery {
  search: string;
  period: PeriodPreset;
  /** Usados apenas quando o periodo e `custom`. */
  from: string;
  to: string;
  kind: string;
  categoryId: string;
  accountId: string;
  status: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

export const emptyQuery: TransactionQuery = {
  search: '',
  period: ALL,
  from: '',
  to: '',
  kind: ALL,
  categoryId: ALL,
  accountId: ALL,
  status: ALL,
  sortField: 'date',
  sortDirection: 'desc',
};

export const periodOptions: Option[] = [
  { value: ALL, label: 'Todo o período' },
  { value: 'this-month', label: 'Este mês' },
  { value: 'last-month', label: 'Mês passado' },
  { value: 'last-30', label: 'Últimos 30 dias' },
  { value: 'last-90', label: 'Últimos 90 dias' },
  { value: 'this-year', label: 'Este ano' },
  { value: 'custom', label: 'Período personalizado' },
];

/** Traduz o periodo escolhido em datas ISO inclusivas. */
export function resolvePeriod(query: TransactionQuery): { from?: string; to?: string } {
  switch (query.period) {
    case 'this-month':
      return monthRange(0);
    case 'last-month':
      return monthRange(-1);
    case 'last-30':
      return lastDaysRange(30);
    case 'last-90':
      return lastDaysRange(90);
    case 'this-year':
      return yearRange();
    case 'custom':
      return {
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
      };
    default:
      return {};
  }
}

/** Alguma restricao ativa? Decide o botao de limpar e o texto do estado vazio. */
export function hasActiveFilters(query: TransactionQuery): boolean {
  return (
    query.search.trim() !== '' ||
    query.period !== ALL ||
    query.kind !== ALL ||
    query.categoryId !== ALL ||
    query.accountId !== ALL ||
    query.status !== ALL
  );
}

function matchesSearch(item: Transaction, term: string): boolean {
  if (!term) return true;
  return (
    item.description.toLowerCase().includes(term) ||
    (item.notes?.toLowerCase().includes(term) ?? false) ||
    (item.category?.name.toLowerCase().includes(term) ?? false) ||
    item.accountName.toLowerCase().includes(term) ||
    (item.toAccountName?.toLowerCase().includes(term) ?? false) ||
    transactionStatusLabel[item.status].toLowerCase().includes(term)
  );
}

function compare(a: Transaction, b: Transaction, field: SortField): number {
  switch (field) {
    case 'amount':
      return a.amount - b.amount;
    case 'description':
      return a.description.localeCompare(b.description, LOCALE);
    default:
      // Empate na data cai para a descricao: a ordem nao muda a cada renderizacao.
      return a.date.localeCompare(b.date) || a.description.localeCompare(b.description, LOCALE);
  }
}

/** Aplica filtros e ordenacao em memoria, sem tocar na lista original. */
export function applyQuery(list: Transaction[], query: TransactionQuery): Transaction[] {
  const term = query.search.trim().toLowerCase();
  const { from, to } = resolvePeriod(query);

  const filtered = list.filter((item) => {
    if (query.kind !== ALL && item.kind !== query.kind) return false;
    if (query.status !== ALL && item.status !== query.status) return false;
    if (query.categoryId !== ALL && item.category?.id !== query.categoryId) return false;
    if (from && item.date < from) return false;
    if (to && item.date > to) return false;

    // Numa transferencia, a conta filtrada pode ser tanto a origem quanto o destino.
    if (query.accountId !== ALL && item.accountId !== query.accountId && item.toAccountId !== query.accountId) {
      return false;
    }

    return matchesSearch(item, term);
  });

  const direction = query.sortDirection === 'asc' ? 1 : -1;
  return filtered.sort((a, b) => compare(a, b, query.sortField) * direction);
}

/**
 * Total liquido do resultado. Transferencia nao entra: ela apenas move dinheiro
 * entre contas do proprio usuario e nao altera o patrimonio.
 */
export function netTotal(list: Transaction[]): number {
  return list.reduce((sum, item) => {
    if (item.kind === 'income') return sum + item.amount;
    if (item.kind === 'expense') return sum - item.amount;
    return sum;
  }, 0);
}
