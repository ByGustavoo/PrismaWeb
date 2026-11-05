import { rotasApi, clienteHttp } from '@/api';
import type { RecorrenteDTO, ID, ResumoRecorrentesDTO, SalvarRecorrenteDTO } from '@/types';

export const recorrentesService = {
  buscarResumo(signal?: AbortSignal): Promise<ResumoRecorrentesDTO> {
    return clienteHttp.get<ResumoRecorrentesDTO>(rotasApi.recorrentes.listar, { ...(signal ? { signal } : {}) });
  },

  criar(payload: SalvarRecorrenteDTO, signal?: AbortSignal): Promise<RecorrenteDTO> {
    return clienteHttp.post<RecorrenteDTO>(rotasApi.recorrentes.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarRecorrenteDTO, signal?: AbortSignal): Promise<RecorrenteDTO> {
    return clienteHttp.put<RecorrenteDTO>(rotasApi.recorrentes.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.recorrentes.porId(id), { ...(signal ? { signal } : {}) });
  },
};
