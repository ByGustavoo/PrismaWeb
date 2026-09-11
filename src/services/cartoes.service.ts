import { ErroApi, rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
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
import {
  montarCartoes,
  montarPlanosComprasParceladas,
  montarDetalheFatura,
  montarFaturas,
  criarCartao,
  criarCompraParcelada,
  excluirCartao,
  excluirCompraParcelada,
  respostaMock,
  atualizarCartao,
  atualizarCompraParcelada,
} from './mocks';

export const cartoesService = {
  listar(signal?: AbortSignal): Promise<CartaoDTO[]> {
    if (ambiente.usarMocks) return respostaMock(montarCartoes(), signal);
    return clienteHttp.get<CartaoDTO[]>(rotasApi.cartoes.listar, { ...(signal ? { signal } : {}) });
  },

  criar(payload: SalvarCartaoDTO, signal?: AbortSignal): Promise<CartaoDTO> {
    if (ambiente.usarMocks) return respostaMock(criarCartao(payload), signal);
    return clienteHttp.post<CartaoDTO>(rotasApi.cartoes.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarCartaoDTO, signal?: AbortSignal): Promise<CartaoDTO> {
    if (ambiente.usarMocks) return respostaMock(atualizarCartao(id, payload), signal);
    return clienteHttp.put<CartaoDTO>(rotasApi.cartoes.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    if (ambiente.usarMocks) {
      excluirCartao(id);
      return respostaMock(undefined, signal);
    }
    return clienteHttp.delete<void>(rotasApi.cartoes.porId(id), { ...(signal ? { signal } : {}) });
  },

  listarFaturas(cardId?: ID, signal?: AbortSignal): Promise<FaturaCartaoDTO[]> {
    if (ambiente.usarMocks) return respostaMock(montarFaturas(cardId), signal);
    return clienteHttp.get<FaturaCartaoDTO[]>(rotasApi.faturas.listar, {
      consulta: { idCartao: cardId },
      ...(signal ? { signal } : {}),
    });
  },

  buscarFatura(id: ID, signal?: AbortSignal): Promise<DetalheFaturaDTO> {
    if (ambiente.usarMocks) {
      const detail = montarDetalheFatura(id);
      if (!detail) return Promise.reject(new ErroApi('Fatura não encontrada!', 404, 'nao_encontrado'));
      return respostaMock(detail, signal);
    }
    return clienteHttp.get<DetalheFaturaDTO>(rotasApi.faturas.porId(id), { ...(signal ? { signal } : {}) });
  },

  listarComprasParceladas(cardId?: ID, signal?: AbortSignal): Promise<PlanoCompraParceladaDTO[]> {
    if (ambiente.usarMocks) return respostaMock(montarPlanosComprasParceladas(cardId), signal);
    return clienteHttp.get<PlanoCompraParceladaDTO[]>(rotasApi.comprasParceladas.listar, {
      consulta: { idCartao: cardId },
      ...(signal ? { signal } : {}),
    });
  },

  criarCompraParcelada(payload: SalvarCompraParceladaDTO, signal?: AbortSignal): Promise<CompraParceladaDTO> {
    if (ambiente.usarMocks) return respostaMock(criarCompraParcelada(payload), signal);
    return clienteHttp.post<CompraParceladaDTO>(rotasApi.comprasParceladas.criar, payload, {
      ...(signal ? { signal } : {}),
    });
  },

  atualizarCompraParcelada(id: ID, payload: SalvarCompraParceladaDTO, signal?: AbortSignal): Promise<CompraParceladaDTO> {
    if (ambiente.usarMocks) return respostaMock(atualizarCompraParcelada(id, payload), signal);
    return clienteHttp.put<CompraParceladaDTO>(rotasApi.comprasParceladas.porId(id), payload, {
      ...(signal ? { signal } : {}),
    });
  },

  excluirCompraParcelada(id: ID, signal?: AbortSignal): Promise<void> {
    if (ambiente.usarMocks) {
      excluirCompraParcelada(id);
      return respostaMock(undefined, signal);
    }
    return clienteHttp.delete<void>(rotasApi.comprasParceladas.porId(id), { ...(signal ? { signal } : {}) });
  },
};
