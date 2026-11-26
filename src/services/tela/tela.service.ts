import { rotasApi, clienteHttp } from '@/api';
import type { TelasOcultasDTO } from '@/types';

export const telaService = {
  buscarOcultas(signal?: AbortSignal): Promise<TelasOcultasDTO> {
    return clienteHttp.get<TelasOcultasDTO>(rotasApi.telas.ocultas, { signal });
  },

  atualizarOcultas(dados: TelasOcultasDTO): Promise<TelasOcultasDTO> {
    return clienteHttp.put<TelasOcultasDTO>(rotasApi.telas.ocultas, dados);
  },
};
