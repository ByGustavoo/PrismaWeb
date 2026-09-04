import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { ForecastSummary } from '@/types';
import { buildForecastSummary, mockResponse } from './mocks';

export const forecastService = {
  /** `months` define o horizonte projetado; sem ele, o padrao do servidor. */
  getSummary(months?: number, signal?: AbortSignal): Promise<ForecastSummary> {
    if (env.useMocks) return mockResponse(buildForecastSummary(months), signal);
    return httpClient.get<ForecastSummary>(endpoints.forecast.summary, {
      query: { months },
      ...(signal ? { signal } : {}),
    });
  },
};
