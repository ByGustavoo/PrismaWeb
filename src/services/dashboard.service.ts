import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { ResumoDashboard } from '@/types';
import { buildDashboardSummary, mockResponse } from './mocks';
import type { DashboardPeriod } from './mocks';

export const dashboardService = {
  /**
   * `period` recorta o resumo por meses (`YYYY-MM`), com `from` e `to` iguais
   * quando e um mes so. Sem ele, o backend responde pelo mes corrente.
   *
   * O recorte e estado de tela e continua em ingles; o que vai para a query
   * string sao `de` e `ate`, que e como o contrato os nomeia.
   */
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
