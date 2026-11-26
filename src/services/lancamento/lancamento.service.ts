import { rotasApi, clienteHttp } from '@/api';
import type { FiltroLancamentoDTO, ID, LancamentoDTO, PaginaLancamentosDTO, SalvarLancamentoDTO } from '@/types';

export const lancamentoService = {
  listar(filtro: FiltroLancamentoDTO = {}, signal?: AbortSignal): Promise<PaginaLancamentosDTO> {
    return clienteHttp.get<PaginaLancamentosDTO>(rotasApi.lancamentos.listar, {
      consulta: {
        tipo: filtro.tipo,
        busca: filtro.busca,
        dataInicial: filtro.dataInicial,
        dataFinal: filtro.dataFinal,
        idCategoria: filtro.idCategoria,
        idOrigem: filtro.idOrigem,
        situacao: filtro.situacao,
        pagina: filtro.pagina,
        tamanho: filtro.tamanho,
        ordenacao: filtro.ordenacao,
        direcao: filtro.direcao,
      },
      signal,
    });
  },

  buscar(id: ID, signal?: AbortSignal): Promise<LancamentoDTO> {
    return clienteHttp.get<LancamentoDTO>(rotasApi.lancamentos.porId(id), { signal });
  },

  criar(payload: SalvarLancamentoDTO, signal?: AbortSignal): Promise<LancamentoDTO> {
    return clienteHttp.post<LancamentoDTO>(rotasApi.lancamentos.criar, payload, { signal });
  },

  atualizar(id: ID, payload: SalvarLancamentoDTO, signal?: AbortSignal): Promise<LancamentoDTO> {
    return clienteHttp.put<LancamentoDTO>(rotasApi.lancamentos.porId(id), payload, { signal });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.lancamentos.porId(id), { signal });
  },
};
