import { rotasApi, clienteHttp } from '@/api';
import type {
  AtualizarMetaDTO,
  FiltroMeta,
  ID,
  MetaDTO,
  ResumoMetasDTO,
  SalvarMetaDTO,
  SalvarMetaPrecoDTO,
} from '@/types';

export const metaService = {
  listar(filters: FiltroMeta = {}, signal?: AbortSignal): Promise<ResumoMetasDTO> {
    return clienteHttp.get<ResumoMetasDTO>(rotasApi.metas.listar, {
      consulta: { situacao: filters.situacao, busca: filters.busca },
      signal,
    });
  },

  criar(payload: SalvarMetaDTO, signal?: AbortSignal): Promise<MetaDTO> {
    return clienteHttp.post<MetaDTO>(rotasApi.metas.criar, payload, { signal });
  },

  atualizar(id: ID, payload: AtualizarMetaDTO, signal?: AbortSignal): Promise<MetaDTO> {
    return clienteHttp.put<MetaDTO>(rotasApi.metas.porId(id), payload, { signal });
  },

  adicionarPreco(id: ID, payload: SalvarMetaPrecoDTO, signal?: AbortSignal): Promise<MetaDTO> {
    return clienteHttp.post<MetaDTO>(rotasApi.metas.precos(id), payload, { signal });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.metas.porId(id), { signal });
  },
};
