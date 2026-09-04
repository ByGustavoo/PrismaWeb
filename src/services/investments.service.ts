import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { ID, Investment, InvestmentPayload, PortfolioSummary } from '@/types';
import {
  buildPortfolioSummary,
  createInvestment,
  deleteInvestment,
  investments,
  mockResponse,
  updateInvestment,
} from './mocks';

/**
 * A carteira tem duas leituras: a lista crua, que o formulario edita, e o
 * consolidado, que a tela mostra. As duas vem do servidor — distribuicao,
 * rentabilidade e evolucao sao conta de backend, nao de componente.
 */
export const investmentsService = {
  list(signal?: AbortSignal): Promise<Investment[]> {
    if (env.useMocks) return mockResponse(investments, signal);
    return httpClient.get<Investment[]>(endpoints.investments.list, { ...(signal ? { signal } : {}) });
  },

  getPortfolio(signal?: AbortSignal): Promise<PortfolioSummary> {
    if (env.useMocks) return mockResponse(buildPortfolioSummary(), signal);
    return httpClient.get<PortfolioSummary>(endpoints.investments.portfolio, { ...(signal ? { signal } : {}) });
  },

  create(payload: InvestmentPayload, signal?: AbortSignal): Promise<Investment> {
    if (env.useMocks) return mockResponse(createInvestment(payload), signal);
    return httpClient.post<Investment>(endpoints.investments.create, payload, { ...(signal ? { signal } : {}) });
  },

  update(id: ID, payload: InvestmentPayload, signal?: AbortSignal): Promise<Investment> {
    if (env.useMocks) return mockResponse(updateInvestment(id, payload), signal);
    return httpClient.put<Investment>(endpoints.investments.byId(id), payload, { ...(signal ? { signal } : {}) });
  },

  remove(id: ID, signal?: AbortSignal): Promise<void> {
    if (env.useMocks) {
      deleteInvestment(id);
      return mockResponse(undefined, signal);
    }
    return httpClient.delete<void>(endpoints.investments.byId(id), { ...(signal ? { signal } : {}) });
  },
};
