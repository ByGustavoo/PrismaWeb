import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { ReportRange, ReportSummary } from '@/types';
import { buildReportSummary, mockResponse } from './mocks';

export const reportsService = {
  /** O recorte vai em datas ISO: relatorio se pede por dia, nao por mes. */
  getSummary(range: ReportRange, signal?: AbortSignal): Promise<ReportSummary> {
    if (env.useMocks) return mockResponse(buildReportSummary(range), signal);
    return httpClient.get<ReportSummary>(endpoints.reports.summary, {
      query: { from: range.from, to: range.to },
      ...(signal ? { signal } : {}),
    });
  },
};
