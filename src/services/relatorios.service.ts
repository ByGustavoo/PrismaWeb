import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { PeriodoRelatorio, RelatorioDTO } from '@/types';
import { montarResumoRelatorio, respostaMock } from './mocks';

export const relatoriosService = {
  buscarResumo(range: PeriodoRelatorio, signal?: AbortSignal): Promise<RelatorioDTO> {
    if (ambiente.usarMocks) return respostaMock(montarResumoRelatorio(range), signal);
    return clienteHttp.get<RelatorioDTO>(rotasApi.relatorios.resumo, {
      consulta: { dataInicial: range.dataInicial, dataFinal: range.dataFinal },
      ...(signal ? { signal } : {}),
    });
  },
};
