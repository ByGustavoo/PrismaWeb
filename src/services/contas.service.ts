import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { ContaDTO, ID, OrigemDTO, SalvarContaDTO } from '@/types';
import {
  contas,
  criarConta,
  excluirConta,
  listarOrigens,
  respostaMock,
  atualizarConta,
} from './mocks';

export const contasService = {
  listar(signal?: AbortSignal): Promise<ContaDTO[]> {
    if (ambiente.usarMocks) return respostaMock(contas, signal);
    return clienteHttp.get<ContaDTO[]>(rotasApi.contas.listar, { ...(signal ? { signal } : {}) });
  },

  listarOrigens(signal?: AbortSignal): Promise<OrigemDTO[]> {
    if (ambiente.usarMocks) return respostaMock(listarOrigens(), signal);
    return clienteHttp.get<OrigemDTO[]>(rotasApi.contas.origens, { ...(signal ? { signal } : {}) });
  },

  criar(payload: SalvarContaDTO, signal?: AbortSignal): Promise<ContaDTO> {
    if (ambiente.usarMocks) return respostaMock(criarConta(payload), signal);
    return clienteHttp.post<ContaDTO>(rotasApi.contas.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarContaDTO, signal?: AbortSignal): Promise<ContaDTO> {
    if (ambiente.usarMocks) return respostaMock(atualizarConta(id, payload), signal);
    return clienteHttp.put<ContaDTO>(rotasApi.contas.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    if (ambiente.usarMocks) {
      excluirConta(id);
      return respostaMock(undefined, signal);
    }
    return clienteHttp.delete<void>(rotasApi.contas.porId(id), { ...(signal ? { signal } : {}) });
  },
};
