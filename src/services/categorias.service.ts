import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { CategoriaDTO, TipoCategoria } from '@/types';
import { categorias, respostaMock } from './mocks';

export const categoriasService = {
  listar(kind?: TipoCategoria, signal?: AbortSignal): Promise<CategoriaDTO[]> {
    if (ambiente.usarMocks) {
      const result = categorias.filter((item) => (kind ? item.tipo === kind : true));
      return respostaMock(result, signal);
    }
    return clienteHttp.get<CategoriaDTO[]>(rotasApi.categorias.listar, {
      consulta: { tipo: kind },
      ...(signal ? { signal } : {}),
    });
  },
};
