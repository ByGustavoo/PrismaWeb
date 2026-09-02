import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { Account, CreditCard, Invoice } from '@/types';
import { accounts, creditCards, invoices, mockResponse } from './mocks';

export const accountsService = {
  list(signal?: AbortSignal): Promise<Account[]> {
    if (env.useMocks) return mockResponse(accounts, signal);
    return httpClient.get<Account[]>(endpoints.accounts.list, { ...(signal ? { signal } : {}) });
  },

  listCards(signal?: AbortSignal): Promise<CreditCard[]> {
    if (env.useMocks) return mockResponse(creditCards, signal);
    return httpClient.get<CreditCard[]>(endpoints.cards.list, { ...(signal ? { signal } : {}) });
  },

  listInvoices(signal?: AbortSignal): Promise<Invoice[]> {
    if (env.useMocks) return mockResponse(invoices, signal);
    return httpClient.get<Invoice[]>(endpoints.cards.invoices, { ...(signal ? { signal } : {}) });
  },
};
