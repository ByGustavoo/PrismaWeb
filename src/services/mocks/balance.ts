import type { Lancamento } from '@/types';
import { monthKeyRange, todayISO } from '@/utils/date';
import { accounts, transactions } from './data';

export function includedAccountIds(): Set<string> {
  return new Set(
    accounts
      .filter((account) => account.status === 'ATIVO' && account.includeInTotal)
      .map((account) => account.id),
  );
}

export function totalBalance(): number {
  return accounts
    .filter((account) => account.status === 'ATIVO' && account.includeInTotal)
    .reduce((total, account) => total + account.balance, 0);
}

export function balanceEffect(item: Lancamento, included: Set<string>): number {
  if (item.tipo === 'RECEITA') return item.valor;
  if (item.tipo === 'DESPESA') return -item.valor;

  const leaves = included.has(item.idOrigem);
  const enters = item.idContaDestino ? included.has(item.idContaDestino) : false;
  if (leaves === enters) return 0;
  return leaves ? -item.valor : item.valor;
}

export function balanceAt(dateISO: string): number {
  const reference = todayISO();
  const ahead = dateISO >= reference;
  const from = ahead ? reference : dateISO;
  const to = ahead ? dateISO : reference;
  const included = includedAccountIds();

  const net = transactions.reduce(
    (sum, item) => (item.data > from && item.data <= to ? sum + balanceEffect(item, included) : sum),
    0,
  );

  return Math.round((totalBalance() + (ahead ? net : -net)) * 100) / 100;
}

export function monthClosingDate(monthKey: string): string {
  const { to } = monthKeyRange(monthKey);
  const reference = todayISO();
  return monthKey === reference.slice(0, 7) && to > reference ? reference : to;
}
