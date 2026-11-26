import { rotasApi, clienteHttp } from '@/api';
import type { DetalheFaturaDTO, FaturaCartaoDTO, FiltroFaturaDTO, ID } from '@/types';

export const faturaService = {
  listar(filtro: FiltroFaturaDTO = {}, signal?: AbortSignal): Promise<FaturaCartaoDTO[]> {
    return clienteHttp.get<FaturaCartaoDTO[]>(rotasApi.faturas.listar, {
      consulta: { idCartao: filtro.idCartao, dataInicial: filtro.dataInicial, dataFinal: filtro.dataFinal },
      signal,
    });
  },

  buscar(id: ID, signal?: AbortSignal): Promise<DetalheFaturaDTO> {
    return clienteHttp.get<DetalheFaturaDTO>(rotasApi.faturas.porId(id), { signal });
  },

  registrarPagamento(id: ID, signal?: AbortSignal): Promise<FaturaCartaoDTO> {
    return clienteHttp.post<FaturaCartaoDTO>(rotasApi.faturas.pagamento(id), undefined, { signal });
  },

  desfazerPagamento(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.faturas.pagamento(id), { signal });
  },
};
