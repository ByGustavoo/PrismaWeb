import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { DashboardSummary } from '@/types';
import { buildDashboardSummary, mockResponse } from './mocks';

export const dashboardService = {
  getSummary(signal?: AbortSignal): Promise<DashboardSummary> {
    if (env.useMocks) {
      return mockResponse(buildDashboardSummary(), signal);
    }
    return httpClient.get<DashboardSummary>(endpoints.dashboard.summary, { signal });
  },
};
