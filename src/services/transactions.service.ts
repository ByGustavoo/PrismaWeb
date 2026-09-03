import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { ID, Transaction, TransactionKind, TransactionPayload, TransactionStatus } from '@/types';
import { createTransaction, deleteTransaction, mockResponse, transactions, updateTransaction } from './mocks';

/**
 * Filtros aceitos pela listagem. Sao os mesmos parametros que a API vai receber
 * como query string; a tela usa apenas `kind` (que vem da rota) e refina busca,
 * periodo, categoria e situacao em memoria, para responder a cada tecla sem uma
 * nova ida ao servidor.
 */
export interface TransactionFilters {
  kind?: TransactionKind;
  search?: string;
  /** Inicio do periodo, data ISO inclusiva. */
  from?: string;
  /** Fim do periodo, data ISO inclusiva. */
  to?: string;
  categoryId?: ID;
  /** Casa com a conta de origem ou, em transferencias, com a de destino. */
  accountId?: ID;
  status?: TransactionStatus;
}

function matches(item: Transaction, filters: TransactionFilters): boolean {
  if (filters.kind && item.kind !== filters.kind) return false;
  if (filters.status && item.status !== filters.status) return false;
  if (filters.categoryId && item.category?.id !== filters.categoryId) return false;
  if (filters.from && item.date < filters.from) return false;
  if (filters.to && item.date > filters.to) return false;

  if (filters.accountId && item.accountId !== filters.accountId && item.toAccountId !== filters.accountId) {
    return false;
  }

  const term = filters.search?.trim().toLowerCase();
  if (!term) return true;

  return (
    item.description.toLowerCase().includes(term) ||
    (item.category?.name.toLowerCase().includes(term) ?? false) ||
    item.accountName.toLowerCase().includes(term) ||
    (item.toAccountName?.toLowerCase().includes(term) ?? false)
  );
}

export const transactionsService = {
  list(filters: TransactionFilters = {}, signal?: AbortSignal): Promise<Transaction[]> {
    if (env.useMocks) {
      const result = transactions.filter((item) => matches(item, filters)).sort((a, b) => b.date.localeCompare(a.date));
      return mockResponse(result, signal);
    }
    return httpClient.get<Transaction[]>(endpoints.transactions.list, {
      query: {
        kind: filters.kind,
        search: filters.search,
        from: filters.from,
        to: filters.to,
        categoryId: filters.categoryId,
        accountId: filters.accountId,
        status: filters.status,
      },
      ...(signal ? { signal } : {}),
    });
  },

  create(payload: TransactionPayload, signal?: AbortSignal): Promise<Transaction> {
    if (env.useMocks) return mockResponse(createTransaction(payload), signal);
    return httpClient.post<Transaction>(endpoints.transactions.create, payload, { ...(signal ? { signal } : {}) });
  },

  update(id: ID, payload: TransactionPayload, signal?: AbortSignal): Promise<Transaction> {
    if (env.useMocks) return mockResponse(updateTransaction(id, payload), signal);
    return httpClient.put<Transaction>(endpoints.transactions.byId(id), payload, { ...(signal ? { signal } : {}) });
  },

  remove(id: ID, signal?: AbortSignal): Promise<void> {
    if (env.useMocks) {
      deleteTransaction(id);
      return mockResponse(undefined, signal);
    }
    return httpClient.delete<void>(endpoints.transactions.byId(id), { ...(signal ? { signal } : {}) });
  },
};
