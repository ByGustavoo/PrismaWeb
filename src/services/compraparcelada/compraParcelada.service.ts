import { rotasApi, clienteHttp } from '@/api';
import type { CompraParceladaDTO, ID, PagamentoParcelaDTO, PlanoCompraParceladaDTO, SalvarCompraParceladaDTO } from '@/types';

export const compraParceladaService = {
  listar(idCartao?: ID, signal?: AbortSignal): Promise<PlanoCompraParceladaDTO[]> {
    return clienteHttp.get<PlanoCompraParceladaDTO[]>(rotasApi.comprasParceladas.listar, {
      consulta: { idCartao },
      signal,
    });
  },

  criar(payload: SalvarCompraParceladaDTO, signal?: AbortSignal): Promise<CompraParceladaDTO> {
    return clienteHttp.post<CompraParceladaDTO>(rotasApi.comprasParceladas.criar, payload, { signal });
  },

  atualizar(id: ID, payload: SalvarCompraParceladaDTO, signal?: AbortSignal): Promise<CompraParceladaDTO> {
    return clienteHttp.put<CompraParceladaDTO>(rotasApi.comprasParceladas.porId(id), payload, { signal });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.comprasParceladas.porId(id), { signal });
  },

  registrarPagamentoParcela(idCompra: ID, numero: number, signal?: AbortSignal): Promise<PagamentoParcelaDTO> {
    return clienteHttp.post<PagamentoParcelaDTO>(rotasApi.comprasParceladas.pagamentoParcela(idCompra, numero), undefined, {
      signal,
    });
  },

  desfazerPagamentoParcela(idCompra: ID, numero: number, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.comprasParceladas.pagamentoParcela(idCompra, numero), { signal });
  },
};
