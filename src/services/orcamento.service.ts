import { rotasApi, clienteHttp } from '@/api';
import type { ID, OrcamentoDTO, SalvarOrcamentoDTO, VisaoGeralOrcamentoDTO } from '@/types';

export const orcamentoService = {
  buscarVisaoGeral(month?: string, signal?: AbortSignal): Promise<VisaoGeralOrcamentoDTO> {
    return clienteHttp.get<VisaoGeralOrcamentoDTO>(rotasApi.orcamentos.visaoGeral, {
      consulta: { mes: month },
      ...(signal ? { signal } : {}),
    });
  },

  criar(payload: SalvarOrcamentoDTO, signal?: AbortSignal): Promise<OrcamentoDTO> {
    return clienteHttp.post<OrcamentoDTO>(rotasApi.orcamentos.criar, payload, { ...(signal ? { signal } : {}) });
  },

  atualizar(id: ID, payload: SalvarOrcamentoDTO, signal?: AbortSignal): Promise<OrcamentoDTO> {
    return clienteHttp.put<OrcamentoDTO>(rotasApi.orcamentos.porId(id), payload, { ...(signal ? { signal } : {}) });
  },

  excluir(id: ID, signal?: AbortSignal): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.orcamentos.porId(id), { ...(signal ? { signal } : {}) });
  },
};
