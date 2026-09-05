import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { Categoria, TipoCategoria } from '@/types';
import { categories, mockResponse } from './mocks';

export const categoriesService = {
  /** Sem `kind` devolve todas; com `kind`, so as que servem para aquele lado. */
  list(kind?: TipoCategoria, signal?: AbortSignal): Promise<Categoria[]> {
    if (env.useMocks) {
      const result = categories.filter((item) => (kind ? item.tipo === kind : true));
      return mockResponse(result, signal);
    }
    return httpClient.get<Categoria[]>(endpoints.categories.list, {
      query: { tipo: kind },
      ...(signal ? { signal } : {}),
    });
  },
};
