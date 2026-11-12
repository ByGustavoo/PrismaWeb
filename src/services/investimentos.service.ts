import { rotasApi, clienteHttp } from '@/api';
import type {
  AtualizarInvestimentoDTO,
  CarteiraDTO,
  ExtratoInvestimentoDTO,
  ID,
  InvestimentoDTO,
  SalvarAcaoDTO,
  SalvarAporteInvestimentoDTO,
  SalvarCotacaoAcaoDTO,
  SalvarInvestimentoDTO,
  SalvarNegociacaoAcaoDTO,
  SalvarResgateInvestimentoDTO,
  SalvarSaldoInvestimentoDTO,
} from '@/types';

export const investimentosService = {
  buscarCarteira(signal?: AbortSignal): Promise<CarteiraDTO> {
    return clienteHttp.get<CarteiraDTO>(rotasApi.investimentos.carteira, { ...(signal ? { signal } : {}) });
  },

  buscarExtrato(id: ID, signal?: AbortSignal): Promise<ExtratoInvestimentoDTO> {
    return clienteHttp.get<ExtratoInvestimentoDTO>(rotasApi.investimentos.extrato(id), { ...(signal ? { signal } : {}) });
  },

  criar(payload: SalvarInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.criar, payload, { ...(signal ? { signal } : {}) });
  },

  criarAcao(payload: SalvarAcaoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.criarAcao, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: AtualizarInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.put<InvestimentoDTO>(rotasApi.investimentos.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  adicionarAporte(id: ID, payload: SalvarAporteInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.aportes(id), payload, { ...(signal ? { signal } : {}) });
  },

  registrarResgate(id: ID, payload: SalvarResgateInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.resgates(id), payload, { ...(signal ? { signal } : {}) });
  },

  atualizarSaldo(id: ID, payload: SalvarSaldoInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.saldos(id), payload, { ...(signal ? { signal } : {}) });
  },

  registrarCompra(id: ID, payload: SalvarNegociacaoAcaoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.compras(id), payload, { ...(signal ? { signal } : {}) });
  },

  registrarVenda(id: ID, payload: SalvarNegociacaoAcaoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.vendas(id), payload, { ...(signal ? { signal } : {}) });
  },

  registrarCotacao(id: ID, payload: SalvarCotacaoAcaoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.cotacoes(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.investimentos.porId(id), { ...(signal ? { signal } : {}) });
  },
};
