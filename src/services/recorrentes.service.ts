import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { DespesaRecorrenteDTO, ID, ResumoDespesasRecorrentesDTO, SalvarDespesaRecorrenteDTO } from '@/types';
import {
  montarResumoRecorrentes,
  criarDespesaRecorrente,
  excluirDespesaRecorrente,
  respostaMock,
  atualizarDespesaRecorrente,
} from './mocks';

export const recorrentesService = {
  buscarResumo(signal?: AbortSignal): Promise<ResumoDespesasRecorrentesDTO> {
    if (ambiente.usarMocks) return respostaMock(montarResumoRecorrentes(), signal);
    return clienteHttp.get<ResumoDespesasRecorrentesDTO>(rotasApi.despesasRecorrentes.listar, { ...(signal ? { signal } : {}) });
  },

  criar(payload: SalvarDespesaRecorrenteDTO, signal?: AbortSignal): Promise<DespesaRecorrenteDTO> {
    if (ambiente.usarMocks) return respostaMock(criarDespesaRecorrente(payload), signal);
    return clienteHttp.post<DespesaRecorrenteDTO>(rotasApi.despesasRecorrentes.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarDespesaRecorrenteDTO, signal?: AbortSignal): Promise<DespesaRecorrenteDTO> {
    if (ambiente.usarMocks) return respostaMock(atualizarDespesaRecorrente(id, payload), signal);
    return clienteHttp.put<DespesaRecorrenteDTO>(rotasApi.despesasRecorrentes.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    if (ambiente.usarMocks) {
      excluirDespesaRecorrente(id);
      return respostaMock(undefined, signal);
    }
    return clienteHttp.delete<void>(rotasApi.despesasRecorrentes.porId(id), { ...(signal ? { signal } : {}) });
  },
};
