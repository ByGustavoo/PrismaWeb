import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { Budget, BudgetOverview, BudgetPayload, ID } from '@/types';
import { buildBudgetOverview, createBudget, deleteBudget, mockResponse, updateBudget } from './mocks';

export const budgetService = {
  /** `month` no formato YYYY-MM; sem ele, o mes corrente. */
  getOverview(month?: string, signal?: AbortSignal): Promise<BudgetOverview> {
    if (env.useMocks) return mockResponse(buildBudgetOverview(month), signal);
    return httpClient.get<BudgetOverview>(endpoints.budgets.overview, {
      query: { month },
      ...(signal ? { signal } : {}),
    });
  },

  create(payload: BudgetPayload, signal?: AbortSignal): Promise<Budget> {
    if (env.useMocks) return mockResponse(createBudget(payload), signal);
    return httpClient.post<Budget>(endpoints.budgets.create, payload, { ...(signal ? { signal } : {}) });
  },

  update(id: ID, payload: BudgetPayload, signal?: AbortSignal): Promise<Budget> {
    if (env.useMocks) return mockResponse(updateBudget(id, payload), signal);
    return httpClient.put<Budget>(endpoints.budgets.byId(id), payload, { ...(signal ? { signal } : {}) });
  },

  remove(id: ID, signal?: AbortSignal): Promise<void> {
    if (env.useMocks) {
      deleteBudget(id);
      return mockResponse(undefined, signal);
    }
    return httpClient.delete<void>(endpoints.budgets.byId(id), { ...(signal ? { signal } : {}) });
  },
};
