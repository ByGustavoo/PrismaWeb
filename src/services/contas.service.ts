import { rotasApi, clienteHttp } from '@/api';
import type { ContaDTO, ID, OrigemDTO, SalvarContaDTO } from '@/types';

export const contasService = {
  listar(signal?: AbortSignal): Promise<ContaDTO[]> {
    return clienteHttp.get<ContaDTO[]>(rotasApi.contas.listar, { ...(signal ? { signal } : {}) });
  },

  listarOrigens(signal?: AbortSignal): Promise<OrigemDTO[]> {
    return clienteHttp.get<OrigemDTO[]>(rotasApi.contas.origens, { ...(signal ? { signal } : {}) });
  },

  criar(payload: SalvarContaDTO, signal?: AbortSignal): Promise<ContaDTO> {
    return clienteHttp.post<ContaDTO>(rotasApi.contas.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarContaDTO, signal?: AbortSignal): Promise<ContaDTO> {
    return clienteHttp.put<ContaDTO>(rotasApi.contas.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.contas.porId(id), { ...(signal ? { signal } : {}) });
  },
};
