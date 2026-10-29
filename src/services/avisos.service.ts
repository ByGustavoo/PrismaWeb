import { rotasApi, clienteHttp } from '@/api';
import type { AdiarAvisoDTO, AvisoDTO, PreferenciasAvisosDTO } from '@/types';

export const avisosService = {
  listar(signal?: AbortSignal): Promise<AvisoDTO[]> {
    return clienteHttp.get<AvisoDTO[]>(rotasApi.avisos.listar, { ...(signal ? { signal } : {}) });
  },

  marcarComoLido(id: string): Promise<AvisoDTO> {
    return clienteHttp.post<AvisoDTO>(rotasApi.avisos.leitura(id));
  },

  adiar(id: string, dados: AdiarAvisoDTO): Promise<AvisoDTO> {
    return clienteHttp.post<AvisoDTO>(rotasApi.avisos.adiamento(id), dados);
  },

  devolverAosNovos(id: string): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.avisos.leitura(id));
  },

  marcarTodosComoLidos(): Promise<AvisoDTO[]> {
    return clienteHttp.post<AvisoDTO[]>(rotasApi.avisos.leituraDeTodos);
  },

  devolverTodosAosNovos(): Promise<void> {
    return clienteHttp.delete<void>(rotasApi.avisos.leituraDeTodos);
  },

  buscarPreferencias(signal?: AbortSignal): Promise<PreferenciasAvisosDTO> {
    return clienteHttp.get<PreferenciasAvisosDTO>(rotasApi.avisos.preferencias, { ...(signal ? { signal } : {}) });
  },

  atualizarPreferencias(dados: PreferenciasAvisosDTO): Promise<PreferenciasAvisosDTO> {
    return clienteHttp.put<PreferenciasAvisosDTO>(rotasApi.avisos.preferencias, dados);
  },
};
