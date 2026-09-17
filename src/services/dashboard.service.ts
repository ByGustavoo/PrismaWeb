import { rotasApi, clienteHttp } from '@/api';
import type { DashboardDTO } from '@/types';

export interface PeriodoDashboard {
  dataInicial: string;
  dataFinal: string;
}

export const dashboardService = {
  buscarResumo(period?: PeriodoDashboard, signal?: AbortSignal): Promise<DashboardDTO> {
    return clienteHttp.get<DashboardDTO>(rotasApi.dashboard.resumo, {
      consulta: { dataInicial: period?.dataInicial, dataFinal: period?.dataFinal },
      signal,
    });
  },
};
