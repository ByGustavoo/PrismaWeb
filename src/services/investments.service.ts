import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { Investment } from '@/types';
import { investments, mockResponse } from './mocks';

export const investmentsService = {
  list(signal?: AbortSignal): Promise<Investment[]> {
    if (env.useMocks) return mockResponse(investments, signal);
    return httpClient.get<Investment[]>(endpoints.investments.list, { ...(signal ? { signal } : {}) });
  },
};
