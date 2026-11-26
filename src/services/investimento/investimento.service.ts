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

export const investimentoService = {
  buscarCarteira(signal?: AbortSignal): Promise<CarteiraDTO> {
    return clienteHttp.get<CarteiraDTO>(rotasApi.investimentos.carteira, { signal });
  },

  buscarExtrato(id: ID, signal?: AbortSignal): Promise<ExtratoInvestimentoDTO> {
    return clienteHttp.get<ExtratoInvestimentoDTO>(rotasApi.investimentos.extrato(id), { signal });
  },

  criar(payload: SalvarInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.criar, payload, { signal });
  },

  criarAcao(payload: SalvarAcaoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.criarAcao, payload, { signal });
  },

  atualizar(id: ID, payload: AtualizarInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.put<InvestimentoDTO>(rotasApi.investimentos.porId(id), payload, { signal });
  },

  adicionarAporte(id: ID, payload: SalvarAporteInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.aportes(id), payload, { signal });
  },

  registrarResgate(id: ID, payload: SalvarResgateInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.resgates(id), payload, { signal });
  },

  atualizarSaldo(id: ID, payload: SalvarSaldoInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.saldos(id), payload, { signal });
  },

  registrarCompra(id: ID, payload: SalvarNegociacaoAcaoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.compras(id), payload, { signal });
  },

  registrarVenda(id: ID, payload: SalvarNegociacaoAcaoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.vendas(id), payload, { signal });
  },

  registrarCotacao(id: ID, payload: SalvarCotacaoAcaoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.cotacoes(id), payload, { signal });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.investimentos.porId(id), { signal });
  },
};
