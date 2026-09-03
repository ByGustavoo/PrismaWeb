import { endpoints, httpClient } from '@/api';
import { env } from '@/constants/env';
import type { Category, CategoryKind } from '@/types';
import { categories, mockResponse } from './mocks';

export const categoriesService = {
  /** Sem `kind` devolve todas; com `kind`, so as que servem para aquele lado. */
  list(kind?: CategoryKind, signal?: AbortSignal): Promise<Category[]> {
    if (env.useMocks) {
      const result = categories.filter((item) => (kind ? item.kind === kind : true));
      return mockResponse(result, signal);
    }
    return httpClient.get<Category[]>(endpoints.categories.list, {
      query: { kind },
      ...(signal ? { signal } : {}),
    });
  },
};
