import { rotasApi, clienteHttp } from '@/api';
import type { TelasOcultasDTO } from '@/types';

export const telasService = {
  buscarOcultas(signal?: AbortSignal): Promise<TelasOcultasDTO> {
    return clienteHttp.get<TelasOcultasDTO>(rotasApi.telas.ocultas, { ...(signal ? { signal } : {}) });
  },

  atualizarOcultas(dados: TelasOcultasDTO): Promise<TelasOcultasDTO> {
    return clienteHttp.put<TelasOcultasDTO>(rotasApi.telas.ocultas, dados);
  },
};
