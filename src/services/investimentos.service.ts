import { rotasApi, clienteHttp } from '@/api';
import type {
  AtualizarInvestimentoDTO,
  CarteiraDTO,
  ExtratoInvestimentoDTO,
  ID,
  InvestimentoDTO,
  SalvarAporteInvestimentoDTO,
  SalvarInvestimentoDTO,
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

  atualizar(id: ID, payload: AtualizarInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.put<InvestimentoDTO>(rotasApi.investimentos.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  adicionarAporte(id: ID, payload: SalvarAporteInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.aportes(id), payload, { ...(signal ? { signal } : {}) });
  },

  atualizarSaldo(id: ID, payload: SalvarSaldoInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.saldos(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.investimentos.porId(id), { ...(signal ? { signal } : {}) });
  },
};
