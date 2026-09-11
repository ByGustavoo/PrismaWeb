import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { ID, LancamentoDTO, SalvarLancamentoDTO, SituacaoLancamento, TipoLancamento } from '@/types';
import { normalizarBusca } from '@/utils/formatacao';
import { criarLancamento, excluirLancamento, respostaMock, lancamentos, atualizarLancamento } from './mocks';

export interface FiltroLancamentoDTO {
  tipo?: TipoLancamento;
  busca?: string;
  dataInicial?: string;
  dataFinal?: string;
  idCategoria?: ID;
  idOrigem?: ID;
  situacao?: SituacaoLancamento;
}

function corresponde(item: LancamentoDTO, filters: FiltroLancamentoDTO): boolean {
  if (filters.tipo && item.tipo !== filters.tipo) return false;
  if (filters.situacao && item.situacao !== filters.situacao) return false;
  if (filters.idCategoria && item.categoria?.id !== filters.idCategoria) return false;
  if (filters.dataInicial && item.data < filters.dataInicial) return false;
  if (filters.dataFinal && item.data > filters.dataFinal) return false;

  if (filters.idOrigem && item.idOrigem !== filters.idOrigem && item.idContaDestino !== filters.idOrigem) {
    return false;
  }

  const term = filters.busca?.trim() ? normalizarBusca(filters.busca.trim()) : '';
  if (!term) return true;

  return [item.descricao, item.categoria?.nome, item.nomeOrigem, item.nomeContaDestino].some((field) =>
    field ? normalizarBusca(field).includes(term) : false,
  );
}

export const lancamentosService = {
  listar(filters: FiltroLancamentoDTO = {}, signal?: AbortSignal): Promise<LancamentoDTO[]> {
    if (ambiente.usarMocks) {
      const result = lancamentos.filter((item) => corresponde(item, filters)).sort((a, b) => b.data.localeCompare(a.data));
      return respostaMock(result, signal);
    }
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
    if (ambiente.usarMocks) return respostaMock(criarLancamento(payload), signal);
    return clienteHttp.post<LancamentoDTO>(rotasApi.lancamentos.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarLancamentoDTO, signal?: AbortSignal): Promise<LancamentoDTO> {
    if (ambiente.usarMocks) return respostaMock(atualizarLancamento(id, payload), signal);
    return clienteHttp.put<LancamentoDTO>(rotasApi.lancamentos.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    if (ambiente.usarMocks) {
      excluirLancamento(id);
      return respostaMock(undefined, signal);
    }
    return clienteHttp.delete<void>(rotasApi.lancamentos.porId(id), { ...(signal ? { signal } : {}) });
  },
};
