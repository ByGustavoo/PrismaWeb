import { rotasApi, clienteHttp } from '@/api';
import type { AvisoDTO } from '@/types';

export const avisosService = {
  listar(signal?: AbortSignal): Promise<AvisoDTO[]> {
    return clienteHttp.get<AvisoDTO[]>(rotasApi.avisos.listar, { ...(signal ? { signal } : {}) });
  },
};
