import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { CarteiraDTO, ID, InvestimentoDTO, SalvarInvestimentoDTO } from '@/types';
import {
  montarResumoCarteira,
  criarInvestimento,
  excluirInvestimento,
  respostaMock,
  atualizarInvestimento,
} from './mocks';

export const investimentosService = {
  buscarCarteira(signal?: AbortSignal): Promise<CarteiraDTO> {
    if (ambiente.usarMocks) return respostaMock(montarResumoCarteira(), signal);
    return clienteHttp.get<CarteiraDTO>(rotasApi.investimentos.carteira, { ...(signal ? { signal } : {}) });
  },

  criar(payload: SalvarInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    if (ambiente.usarMocks) return respostaMock(criarInvestimento(payload), signal);
    return clienteHttp.post<InvestimentoDTO>(rotasApi.investimentos.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarInvestimentoDTO, signal?: AbortSignal): Promise<InvestimentoDTO> {
    if (ambiente.usarMocks) return respostaMock(atualizarInvestimento(id, payload), signal);
    return clienteHttp.put<InvestimentoDTO>(rotasApi.investimentos.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    if (ambiente.usarMocks) {
      excluirInvestimento(id);
      return respostaMock(undefined, signal);
    }
    return clienteHttp.delete<void>(rotasApi.investimentos.porId(id), { ...(signal ? { signal } : {}) });
  },
};
