import { rotasApi, clienteHttp } from '@/api';
import type { PeriodoRelatorio, RelatorioDTO } from '@/types';

export const relatoriosService = {
  buscarResumo(range: PeriodoRelatorio, signal?: AbortSignal): Promise<RelatorioDTO> {
    return clienteHttp.get<RelatorioDTO>(rotasApi.relatorios.resumo, {
      consulta: { dataInicial: range.dataInicial, dataFinal: range.dataFinal },
      ...(signal ? { signal } : {}),
    });
  },
};
