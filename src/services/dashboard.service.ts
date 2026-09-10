import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { ResumoDashboard } from '@/types';
import { buildDashboardSummary, mockResponse } from './mocks';
import type { DashboardPeriod } from './mocks';

export const dashboardService = {
  getSummary(period?: DashboardPeriod, signal?: AbortSignal): Promise<ResumoDashboard> {
    if (env.useMocks) {
      return mockResponse(buildDashboardSummary(period), signal);
    }
    return httpClient.get<ResumoDashboard>(endpoints.dashboard.resumo, {
      query: { de: period?.from, ate: period?.to },
      signal,
    });
  },
};
