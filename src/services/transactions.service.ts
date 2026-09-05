import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { ID, Lancamento, TipoLancamento, LancamentoPayload, SituacaoLancamento } from '@/types';
import { createTransaction, deleteTransaction, mockResponse, transactions, updateTransaction } from './mocks';

/**
 * Filtros aceitos pela listagem. Sao os mesmos parametros que a API vai receber
 * como query string; a tela usa apenas `kind` (que vem da rota) e refina busca,
 * periodo, categoria e situacao em memoria, para responder a cada tecla sem uma
 * nova ida ao servidor.
 *
 * Os nomes aqui sao de estado de tela e seguem em ingles; a traducao para os
 * parametros do contrato (`tipo`, `busca`, `de`, `ate`...) acontece so na
 * montagem da query.
 */
export interface TransactionFilters {
  kind?: TipoLancamento;
  search?: string;
  /** Inicio do periodo, data ISO inclusiva. */
  from?: string;
  /** Fim do periodo, data ISO inclusiva. */
  to?: string;
  categoryId?: ID;
  /** Casa com a conta de origem ou, em transferencias, com a de destino. */
  accountId?: ID;
  status?: SituacaoLancamento;
}

function matches(item: Lancamento, filters: TransactionFilters): boolean {
  if (filters.kind && item.tipo !== filters.kind) return false;
  if (filters.status && item.situacao !== filters.status) return false;
  if (filters.categoryId && item.categoria?.id !== filters.categoryId) return false;
  if (filters.from && item.data < filters.from) return false;
  if (filters.to && item.data > filters.to) return false;

  if (filters.accountId && item.idOrigem !== filters.accountId && item.idContaDestino !== filters.accountId) {
    return false;
  }

  const term = filters.search?.trim().toLowerCase();
  if (!term) return true;

  return (
    item.descricao.toLowerCase().includes(term) ||
    (item.categoria?.nome.toLowerCase().includes(term) ?? false) ||
    item.nomeOrigem.toLowerCase().includes(term) ||
    (item.nomeContaDestino?.toLowerCase().includes(term) ?? false)
  );
}

export const transactionsService = {
  list(filters: TransactionFilters = {}, signal?: AbortSignal): Promise<Lancamento[]> {
    if (env.useMocks) {
      const result = transactions.filter((item) => matches(item, filters)).sort((a, b) => b.data.localeCompare(a.data));
      return mockResponse(result, signal);
    }
    return httpClient.get<Lancamento[]>(endpoints.transactions.list, {
      query: {
        tipo: filters.kind,
        busca: filters.search,
        de: filters.from,
        ate: filters.to,
        idCategoria: filters.categoryId,
        idOrigem: filters.accountId,
        situacao: filters.status,
      },
      ...(signal ? { signal } : {}),
    });
  },

  create(payload: LancamentoPayload, signal?: AbortSignal): Promise<Lancamento> {
    if (env.useMocks) return mockResponse(createTransaction(payload), signal);
    return httpClient.post<Lancamento>(endpoints.transactions.create, payload, { ...(signal ? { signal } : {}) });
  },

  update(id: ID, payload: LancamentoPayload, signal?: AbortSignal): Promise<Lancamento> {
    if (env.useMocks) return mockResponse(updateTransaction(id, payload), signal);
    return httpClient.put<Lancamento>(endpoints.transactions.byId(id), payload, { ...(signal ? { signal } : {}) });
  },

  remove(id: ID, signal?: AbortSignal): Promise<void> {
    if (env.useMocks) {
      deleteTransaction(id);
      return mockResponse(undefined, signal);
    }
    return httpClient.delete<void>(endpoints.transactions.byId(id), { ...(signal ? { signal } : {}) });
  },
};
