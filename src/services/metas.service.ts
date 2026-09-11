import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { AtualizarMetaDTO, ID, MetaDTO, ResumoMetasDTO, SalvarMetaDTO, SalvarMetaPrecoDTO } from '@/types';
import { adicionarPrecoMeta, montarResumoMetas, criarMeta, excluirMeta, respostaMock, atualizarMeta } from './mocks';
import type { FiltroMeta } from './mocks';

export const metasService = {
  listar(filters: FiltroMeta = {}, signal?: AbortSignal): Promise<ResumoMetasDTO> {
    if (ambiente.usarMocks) return respostaMock(montarResumoMetas(filters), signal);
    return clienteHttp.get<ResumoMetasDTO>(rotasApi.metas.listar, {
      consulta: { situacao: filters.situacao, busca: filters.busca },
      ...(signal ? { signal } : {}),
    });
  },

  criar(payload: SalvarMetaDTO, signal?: AbortSignal): Promise<MetaDTO> {
    if (ambiente.usarMocks) return respostaMock(criarMeta(payload), signal);
    return clienteHttp.post<MetaDTO>(rotasApi.metas.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: AtualizarMetaDTO, signal?: AbortSignal): Promise<MetaDTO> {
    if (ambiente.usarMocks) return respostaMock(atualizarMeta(id, payload), signal);
    return clienteHttp.put<MetaDTO>(rotasApi.metas.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  adicionarPreco(id: ID, payload: SalvarMetaPrecoDTO, signal?: AbortSignal): Promise<MetaDTO> {
    if (ambiente.usarMocks) return respostaMock(adicionarPrecoMeta(id, payload), signal);
    return clienteHttp.post<MetaDTO>(rotasApi.metas.precos(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    if (ambiente.usarMocks) {
      excluirMeta(id);
      return respostaMock(undefined, signal);
    }
    return clienteHttp.delete<void>(rotasApi.metas.porId(id), { ...(signal ? { signal } : {}) });
  },
};
