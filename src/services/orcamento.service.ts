import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { ID, OrcamentoDTO, SalvarOrcamentoDTO, VisaoGeralOrcamentoDTO } from '@/types';
import { montarVisaoGeralOrcamento, criarOrcamento, excluirOrcamento, respostaMock, atualizarOrcamento } from './mocks';

export const orcamentoService = {
  buscarVisaoGeral(month?: string, signal?: AbortSignal): Promise<VisaoGeralOrcamentoDTO> {
    if (ambiente.usarMocks) return respostaMock(montarVisaoGeralOrcamento(month), signal);
    return clienteHttp.get<VisaoGeralOrcamentoDTO>(rotasApi.orcamentos.visaoGeral, {
      consulta: { mes: month },
      ...(signal ? { signal } : {}),
    });
  },

  criar(payload: SalvarOrcamentoDTO, signal?: AbortSignal): Promise<OrcamentoDTO> {
    if (ambiente.usarMocks) return respostaMock(criarOrcamento(payload), signal);
    return clienteHttp.post<OrcamentoDTO>(rotasApi.orcamentos.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarOrcamentoDTO, signal?: AbortSignal): Promise<OrcamentoDTO> {
    if (ambiente.usarMocks) return respostaMock(atualizarOrcamento(id, payload), signal);
    return clienteHttp.put<OrcamentoDTO>(rotasApi.orcamentos.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    if (ambiente.usarMocks) {
      excluirOrcamento(id);
      return respostaMock(undefined, signal);
    }
    return clienteHttp.delete<void>(rotasApi.orcamentos.porId(id), { ...(signal ? { signal } : {}) });
  },
};
