import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { Alert } from '@/types';
import { buildAlerts, mockResponse } from './mocks';

export const alertsService = {
  list(signal?: AbortSignal): Promise<Alert[]> {
    if (env.useMocks) {
      return mockResponse(buildAlerts(), signal);
    }
    return httpClient.get<Alert[]>(endpoints.alerts.list, { ...(signal ? { signal } : {}) });
  },
};
