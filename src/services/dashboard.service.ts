import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { DashboardSummary } from '@/types';
import { buildDashboardSummary, mockResponse } from './mocks';
import type { DashboardPeriod } from './mocks';

export const dashboardService = {
  /**
   * `period` recorta o resumo por meses (`YYYY-MM`), com `from` e `to` iguais
   * quando e um mes so. Sem ele, o backend responde pelo mes corrente.
   */
  getSummary(period?: DashboardPeriod, signal?: AbortSignal): Promise<DashboardSummary> {
    if (env.useMocks) {
      return mockResponse(buildDashboardSummary(period), signal);
    }
    return httpClient.get<DashboardSummary>(endpoints.dashboard.summary, {
      query: { from: period?.from, to: period?.to },
      signal,
    });
  },
};
