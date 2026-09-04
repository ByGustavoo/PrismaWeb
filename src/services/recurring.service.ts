import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { ID, RecurringExpense, RecurringPayload, RecurringSummary } from '@/types';
import {
  buildRecurringSummary,
  createRecurringExpense,
  deleteRecurringExpense,
  mockResponse,
  updateRecurringExpense,
} from './mocks';

export const recurringService = {
  /** Lista ja acompanhada do custo mensal equivalente e dos vencimentos proximos. */
  getSummary(signal?: AbortSignal): Promise<RecurringSummary> {
    if (env.useMocks) return mockResponse(buildRecurringSummary(), signal);
    return httpClient.get<RecurringSummary>(endpoints.recurring.list, { ...(signal ? { signal } : {}) });
  },

  create(payload: RecurringPayload, signal?: AbortSignal): Promise<RecurringExpense> {
    if (env.useMocks) return mockResponse(createRecurringExpense(payload), signal);
    return httpClient.post<RecurringExpense>(endpoints.recurring.create, payload, { ...(signal ? { signal } : {}) });
  },

  update(id: ID, payload: RecurringPayload, signal?: AbortSignal): Promise<RecurringExpense> {
    if (env.useMocks) return mockResponse(updateRecurringExpense(id, payload), signal);
    return httpClient.put<RecurringExpense>(endpoints.recurring.byId(id), payload, { ...(signal ? { signal } : {}) });
  },

  remove(id: ID, signal?: AbortSignal): Promise<void> {
    if (env.useMocks) {
      deleteRecurringExpense(id);
      return mockResponse(undefined, signal);
    }
    return httpClient.delete<void>(endpoints.recurring.byId(id), { ...(signal ? { signal } : {}) });
  },
};
