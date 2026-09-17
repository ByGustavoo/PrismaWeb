import { rotasApi, clienteHttp } from '@/api';
import type { VersaoSistemaDTO } from '@/types';

export const sistemaService = {
  buscarVersao(signal?: AbortSignal): Promise<VersaoSistemaDTO> {
    return clienteHttp.get<VersaoSistemaDTO>(rotasApi.sistema.versao, { ...(signal ? { signal } : {}) });
  },
};
