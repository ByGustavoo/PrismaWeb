import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { Goal, GoalPayload, GoalPricePayload, GoalUpdatePayload, GoalsSummary, ID } from '@/types';
import { addGoalPrice, buildGoalsSummary, createGoal, deleteGoal, mockResponse, updateGoal } from './mocks';
import type { GoalFilters } from './mocks';

/**
 * Metas e desejos. A listagem devolve o consolidado — variacao, menor preco,
 * media e leitura do momento vem calculados —, do mesmo jeito que a carteira de
 * investimentos: conta de servidor, nao de componente.
 *
 * `status` e `search` sao os parametros que a API vai receber como query
 * string. A tela hoje nao os usa: com poucas dezenas de metas, filtrar e
 * ordenar em memoria responde a cada tecla sem uma nova ida ao servidor.
 */
export const goalsService = {
  list(filters: GoalFilters = {}, signal?: AbortSignal): Promise<GoalsSummary> {
    if (env.useMocks) return mockResponse(buildGoalsSummary(filters), signal);
    return httpClient.get<GoalsSummary>(endpoints.goals.list, {
      query: { status: filters.status, search: filters.search },
      ...(signal ? { signal } : {}),
    });
  },

  create(payload: GoalPayload, signal?: AbortSignal): Promise<Goal> {
    if (env.useMocks) return mockResponse(createGoal(payload), signal);
    return httpClient.post<Goal>(endpoints.goals.create, payload, { ...(signal ? { signal } : {}) });
  },

  update(id: ID, payload: GoalUpdatePayload, signal?: AbortSignal): Promise<Goal> {
    if (env.useMocks) return mockResponse(updateGoal(id, payload), signal);
    return httpClient.put<Goal>(endpoints.goals.byId(id), payload, { ...(signal ? { signal } : {}) });
  },

  /** Acrescenta um preco ao historico e devolve a meta com a serie atualizada. */
  addPrice(id: ID, payload: GoalPricePayload, signal?: AbortSignal): Promise<Goal> {
    if (env.useMocks) return mockResponse(addGoalPrice(id, payload), signal);
    return httpClient.post<Goal>(endpoints.goals.prices(id), payload, { ...(signal ? { signal } : {}) });
  },

  remove(id: ID, signal?: AbortSignal): Promise<void> {
    if (env.useMocks) {
      deleteGoal(id);
      return mockResponse(undefined, signal);
    }
    return httpClient.delete<void>(endpoints.goals.byId(id), { ...(signal ? { signal } : {}) });
  },
};
