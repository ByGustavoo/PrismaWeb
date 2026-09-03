import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { Account, AccountPayload, ID, PaymentSource } from '@/types';
import {
  accounts,
  createAccount,
  deleteAccount,
  listPaymentSources,
  mockResponse,
  updateAccount,
} from './mocks';

export const accountsService = {
  list(signal?: AbortSignal): Promise<Account[]> {
    if (env.useMocks) return mockResponse(accounts, signal);
    return httpClient.get<Account[]>(endpoints.accounts.list, { ...(signal ? { signal } : {}) });
  },

  /** Contas e cartoes na mesma lista, do jeito que os seletores de lancamento precisam. */
  listSources(signal?: AbortSignal): Promise<PaymentSource[]> {
    if (env.useMocks) return mockResponse(listPaymentSources(), signal);
    return httpClient.get<PaymentSource[]>(endpoints.accounts.sources, { ...(signal ? { signal } : {}) });
  },

  create(payload: AccountPayload, signal?: AbortSignal): Promise<Account> {
    if (env.useMocks) return mockResponse(createAccount(payload), signal);
    return httpClient.post<Account>(endpoints.accounts.create, payload, { ...(signal ? { signal } : {}) });
  },

  update(id: ID, payload: AccountPayload, signal?: AbortSignal): Promise<Account> {
    if (env.useMocks) return mockResponse(updateAccount(id, payload), signal);
    return httpClient.put<Account>(endpoints.accounts.byId(id), payload, { ...(signal ? { signal } : {}) });
  },

  remove(id: ID, signal?: AbortSignal): Promise<void> {
    if (env.useMocks) {
      deleteAccount(id);
      return mockResponse(undefined, signal);
    }
    return httpClient.delete<void>(endpoints.accounts.byId(id), { ...(signal ? { signal } : {}) });
  },
};
