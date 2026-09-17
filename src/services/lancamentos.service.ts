import { rotasApi, clienteHttp } from '@/api';
import type { ID, LancamentoDTO, SalvarLancamentoDTO, SituacaoLancamento, TipoLancamento } from '@/types';

export interface FiltroLancamentoDTO {
  tipo?: TipoLancamento;
  busca?: string;
  dataInicial?: string;
  dataFinal?: string;
  idCategoria?: ID;
  idOrigem?: ID;
  situacao?: SituacaoLancamento;
}

export const lancamentosService = {
  listar(filters: FiltroLancamentoDTO = {}, signal?: AbortSignal): Promise<LancamentoDTO[]> {
    return clienteHttp.get<LancamentoDTO[]>(rotasApi.lancamentos.listar, {
      consulta: {
        tipo: filters.tipo,
        busca: filters.busca,
        dataInicial: filters.dataInicial,
        dataFinal: filters.dataFinal,
        idCategoria: filters.idCategoria,
        idOrigem: filters.idOrigem,
        situacao: filters.situacao,
      },
      ...(signal ? { signal } : {}),
    });
  },

  criar(payload: SalvarLancamentoDTO, signal?: AbortSignal): Promise<LancamentoDTO> {
    return clienteHttp.post<LancamentoDTO>(rotasApi.lancamentos.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarLancamentoDTO, signal?: AbortSignal): Promise<LancamentoDTO> {
    return clienteHttp.put<LancamentoDTO>(rotasApi.lancamentos.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.lancamentos.porId(id), { ...(signal ? { signal } : {}) });
  },
};
