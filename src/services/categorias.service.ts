import { rotasApi, clienteHttp } from '@/api';
import type { CategoriaDTO, TipoCategoria } from '@/types';

export const categoriasService = {
  listar(kind?: TipoCategoria, signal?: AbortSignal): Promise<CategoriaDTO[]> {
    return clienteHttp.get<CategoriaDTO[]>(rotasApi.categorias.listar, {
      consulta: { tipo: kind },
      ...(signal ? { signal } : {}),
    });
  },
};
