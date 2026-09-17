import { rotasApi, clienteHttp } from '@/api';
import type { PrevisaoDTO } from '@/types';

export const previsaoService = {
  buscarResumo(months?: number, signal?: AbortSignal): Promise<PrevisaoDTO> {
    return clienteHttp.get<PrevisaoDTO>(rotasApi.previsao.resumo, {
      consulta: { meses: months },
      ...(signal ? { signal } : {}),
    });
  },
};
