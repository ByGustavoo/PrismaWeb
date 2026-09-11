import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { DashboardDTO } from '@/types';
import { montarResumoDashboard, respostaMock } from './mocks';
import type { PeriodoDashboard } from './mocks';

export const dashboardService = {
  buscarResumo(period?: PeriodoDashboard, signal?: AbortSignal): Promise<DashboardDTO> {
    if (ambiente.usarMocks) {
      return respostaMock(montarResumoDashboard(period), signal);
    }
    return clienteHttp.get<DashboardDTO>(rotasApi.dashboard.resumo, {
      consulta: { dataInicial: period?.dataInicial, dataFinal: period?.dataFinal },
      signal,
    });
  },
};
