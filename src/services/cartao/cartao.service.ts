import { rotasApi, clienteHttp } from '@/api';
import { origensAlteradas } from '@/services/conta/origensAlteradas';
import type { CartaoDTO, ID, SalvarCartaoDTO } from '@/types';

export const cartaoService = {
  listar(signal?: AbortSignal): Promise<CartaoDTO[]> {
    return clienteHttp.get<CartaoDTO[]>(rotasApi.cartoes.listar, { signal });
  },

  criar(payload: SalvarCartaoDTO, signal?: AbortSignal): Promise<CartaoDTO> {
    return clienteHttp.post<CartaoDTO>(rotasApi.cartoes.criar, payload, { signal }).then(origensAlteradas.marcar);
  },

  atualizar(id: ID, payload: SalvarCartaoDTO, signal?: AbortSignal): Promise<CartaoDTO> {
    return clienteHttp.put<CartaoDTO>(rotasApi.cartoes.porId(id), payload, { signal }).then(origensAlteradas.marcar);
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.cartoes.porId(id), { signal }).then(origensAlteradas.marcar);
  },
};
