import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { PrevisaoDTO } from '@/types';
import { montarResumoPrevisao, respostaMock } from './mocks';

export const previsaoService = {
  buscarResumo(months?: number, signal?: AbortSignal): Promise<PrevisaoDTO> {
    if (ambiente.usarMocks) return respostaMock(montarResumoPrevisao(months), signal);
    return clienteHttp.get<PrevisaoDTO>(rotasApi.previsao.resumo, {
      consulta: { meses: months },
      ...(signal ? { signal } : {}),
    });
  },
};
