import { rotasApi, clienteHttp } from '@/api';
import type { DespesaRecorrenteDTO, ID, ResumoDespesasRecorrentesDTO, SalvarDespesaRecorrenteDTO } from '@/types';

export const recorrentesService = {
  buscarResumo(signal?: AbortSignal): Promise<ResumoDespesasRecorrentesDTO> {
    return clienteHttp.get<ResumoDespesasRecorrentesDTO>(rotasApi.despesasRecorrentes.listar, { ...(signal ? { signal } : {}) });
  },

  criar(payload: SalvarDespesaRecorrenteDTO, signal?: AbortSignal): Promise<DespesaRecorrenteDTO> {
    return clienteHttp.post<DespesaRecorrenteDTO>(rotasApi.despesasRecorrentes.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarDespesaRecorrenteDTO, signal?: AbortSignal): Promise<DespesaRecorrenteDTO> {
    return clienteHttp.put<DespesaRecorrenteDTO>(rotasApi.despesasRecorrentes.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.despesasRecorrentes.porId(id), { ...(signal ? { signal } : {}) });
  },
};
