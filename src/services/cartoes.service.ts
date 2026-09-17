import { rotasApi, clienteHttp } from '@/api';
import type {
  CartaoDTO,
  CompraParceladaDTO,
  DetalheFaturaDTO,
  FaturaCartaoDTO,
  ID,
  PlanoCompraParceladaDTO,
  SalvarCartaoDTO,
  SalvarCompraParceladaDTO,
} from '@/types';

export const cartoesService = {
  listar(signal?: AbortSignal): Promise<CartaoDTO[]> {
    return clienteHttp.get<CartaoDTO[]>(rotasApi.cartoes.listar, { ...(signal ? { signal } : {}) });
  },

  criar(payload: SalvarCartaoDTO, signal?: AbortSignal): Promise<CartaoDTO> {
    return clienteHttp.post<CartaoDTO>(rotasApi.cartoes.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarCartaoDTO, signal?: AbortSignal): Promise<CartaoDTO> {
    return clienteHttp.put<CartaoDTO>(rotasApi.cartoes.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.cartoes.porId(id), { ...(signal ? { signal } : {}) });
  },

  listarFaturas(cardId?: ID, signal?: AbortSignal): Promise<FaturaCartaoDTO[]> {
    return clienteHttp.get<FaturaCartaoDTO[]>(rotasApi.faturas.listar, {
      consulta: { idCartao: cardId },
      ...(signal ? { signal } : {}),
    });
  },

  buscarFatura(id: ID, signal?: AbortSignal): Promise<DetalheFaturaDTO> {
    return clienteHttp.get<DetalheFaturaDTO>(rotasApi.faturas.porId(id), { ...(signal ? { signal } : {}) });
  },

  listarComprasParceladas(cardId?: ID, signal?: AbortSignal): Promise<PlanoCompraParceladaDTO[]> {
    return clienteHttp.get<PlanoCompraParceladaDTO[]>(rotasApi.comprasParceladas.listar, {
      consulta: { idCartao: cardId },
      ...(signal ? { signal } : {}),
    });
  },

  criarCompraParcelada(payload: SalvarCompraParceladaDTO, signal?: AbortSignal): Promise<CompraParceladaDTO> {
    return clienteHttp.post<CompraParceladaDTO>(rotasApi.comprasParceladas.criar, payload, {
      ...(signal ? { signal } : {}),
    });
  },

  atualizarCompraParcelada(id: ID, payload: SalvarCompraParceladaDTO, signal?: AbortSignal): Promise<CompraParceladaDTO> {
    return clienteHttp.put<CompraParceladaDTO>(rotasApi.comprasParceladas.porId(id), payload, {
      ...(signal ? { signal } : {}),
    });
  },

  excluirCompraParcelada(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.comprasParceladas.porId(id), { ...(signal ? { signal } : {}) });
  },
};
