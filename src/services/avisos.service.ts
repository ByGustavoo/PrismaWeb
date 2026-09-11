import { rotasApi, clienteHttp } from '@/api';
import { ambiente } from '@/constants/ambiente';
import type { AvisoDTO } from '@/types';
import { montarAvisos, respostaMock } from './mocks';

export const avisosService = {
  listar(signal?: AbortSignal): Promise<AvisoDTO[]> {
    if (ambiente.usarMocks) {
      return respostaMock(montarAvisos(), signal);
    }
    return clienteHttp.get<AvisoDTO[]>(rotasApi.avisos.listar, { ...(signal ? { signal } : {}) });
  },
};
