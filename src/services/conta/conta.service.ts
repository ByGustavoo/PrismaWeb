import { rotasApi, clienteHttp } from '@/api';
import { origensAlteradas } from './origensAlteradas';
import type { ContaDTO, ID, OrigemDTO, SalvarContaDTO } from '@/types';

export const contaService = {
  listar(signal?: AbortSignal): Promise<ContaDTO[]> {
    return clienteHttp.get<ContaDTO[]>(rotasApi.contas.listar, { signal });
  },

  listarOrigens(signal?: AbortSignal): Promise<OrigemDTO[]> {
    return clienteHttp.get<OrigemDTO[]>(rotasApi.contas.origens, { signal });
  },

  criar(payload: SalvarContaDTO, signal?: AbortSignal): Promise<ContaDTO> {
    return clienteHttp.post<ContaDTO>(rotasApi.contas.criar, payload, { signal }).then(origensAlteradas.marcar);
  },

  atualizar(id: ID, payload: SalvarContaDTO, signal?: AbortSignal): Promise<ContaDTO> {
    return clienteHttp.put<ContaDTO>(rotasApi.contas.porId(id), payload, { signal }).then(origensAlteradas.marcar);
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.contas.porId(id), { signal }).then(origensAlteradas.marcar);
  },
};
