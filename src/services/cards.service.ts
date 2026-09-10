import { ApiError, endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type {
  Card,
  CardPayload,
  ID,
  InstallmentPayload,
  InstallmentPlan,
  InstallmentPurchase,
  Invoice,
  InvoiceDetail,
} from '@/types';
import {
  buildCards,
  buildInstallmentPlans,
  buildInvoiceDetail,
  buildInvoices,
  createCard,
  createInstallmentPurchase,
  deleteCard,
  deleteInstallmentPurchase,
  mockResponse,
  updateCard,
  updateInstallmentPurchase,
} from './mocks';

export const cardsService = {
  list(signal?: AbortSignal): Promise<Card[]> {
    if (env.useMocks) return mockResponse(buildCards(), signal);
    return httpClient.get<Card[]>(endpoints.cards.list, { ...(signal ? { signal } : {}) });
  },

  create(payload: CardPayload, signal?: AbortSignal): Promise<Card> {
    if (env.useMocks) return mockResponse(createCard(payload), signal);
    return httpClient.post<Card>(endpoints.cards.create, payload, { ...(signal ? { signal } : {}) });
  },

  update(id: ID, payload: CardPayload, signal?: AbortSignal): Promise<Card> {
    if (env.useMocks) return mockResponse(updateCard(id, payload), signal);
    return httpClient.put<Card>(endpoints.cards.byId(id), payload, { ...(signal ? { signal } : {}) });
  },

  remove(id: ID, signal?: AbortSignal): Promise<void> {
    if (env.useMocks) {
      deleteCard(id);
      return mockResponse(undefined, signal);
    }
    return httpClient.delete<void>(endpoints.cards.byId(id), { ...(signal ? { signal } : {}) });
  },

  listInvoices(cardId?: ID, signal?: AbortSignal): Promise<Invoice[]> {
    if (env.useMocks) return mockResponse(buildInvoices(cardId), signal);
    return httpClient.get<Invoice[]>(endpoints.invoices.list, {
      query: { cardId },
      ...(signal ? { signal } : {}),
    });
  },

  getInvoice(id: ID, signal?: AbortSignal): Promise<InvoiceDetail> {
    if (env.useMocks) {
      const detail = buildInvoiceDetail(id);
      if (!detail) return Promise.reject(new ApiError('Fatura não encontrada.', 404, 'nao_encontrado'));
      return mockResponse(detail, signal);
    }
    return httpClient.get<InvoiceDetail>(endpoints.invoices.byId(id), { ...(signal ? { signal } : {}) });
  },

  listInstallments(cardId?: ID, signal?: AbortSignal): Promise<InstallmentPlan[]> {
    if (env.useMocks) return mockResponse(buildInstallmentPlans(cardId), signal);
    return httpClient.get<InstallmentPlan[]>(endpoints.installments.list, {
      query: { cardId },
      ...(signal ? { signal } : {}),
    });
  },

  createInstallment(payload: InstallmentPayload, signal?: AbortSignal): Promise<InstallmentPurchase> {
    if (env.useMocks) return mockResponse(createInstallmentPurchase(payload), signal);
    return httpClient.post<InstallmentPurchase>(endpoints.installments.create, payload, {
      ...(signal ? { signal } : {}),
    });
  },

  updateInstallment(id: ID, payload: InstallmentPayload, signal?: AbortSignal): Promise<InstallmentPurchase> {
    if (env.useMocks) return mockResponse(updateInstallmentPurchase(id, payload), signal);
    return httpClient.put<InstallmentPurchase>(endpoints.installments.byId(id), payload, {
      ...(signal ? { signal } : {}),
    });
  },

  removeInstallment(id: ID, signal?: AbortSignal): Promise<void> {
    if (env.useMocks) {
      deleteInstallmentPurchase(id);
      return mockResponse(undefined, signal);
    }
    return httpClient.delete<void>(endpoints.installments.byId(id), { ...(signal ? { signal } : {}) });
  },
};
