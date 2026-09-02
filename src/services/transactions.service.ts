import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { Transaction, TransactionKind } from '@/types';
import { mockResponse, transactions } from './mocks';

export interface TransactionFilters {
  kind?: TransactionKind;
  search?: string;
}

function applyFilters(list: Transaction[], filters: TransactionFilters): Transaction[] {
  const term = filters.search?.trim().toLowerCase();

  return list
    .filter((item) => (filters.kind ? item.kind === filters.kind : true))
    .filter((item) => {
      if (!term) return true;
      return (
        item.description.toLowerCase().includes(term) ||
        item.category.name.toLowerCase().includes(term) ||
        item.accountName.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const transactionsService = {
  list(filters: TransactionFilters = {}, signal?: AbortSignal): Promise<Transaction[]> {
    if (env.useMocks) {
      return mockResponse(applyFilters(transactions, filters), signal);
    }
    return httpClient.get<Transaction[]>(endpoints.transactions.list, {
      query: { kind: filters.kind, search: filters.search },
      ...(signal ? { signal } : {}),
    });
  },
};
