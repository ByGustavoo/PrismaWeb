import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { avisoService } from '@/services';
import type { AvisoDTO } from '@/types';

interface ValorContextoAvisos {
  avisos: AvisoDTO[] | null;
  carregando: boolean;
  erro: Error | null;
  atualizarAvisos: () => void;
  substituirAviso: (aviso: AvisoDTO) => void;
  substituirAvisos: (avisos: AvisoDTO[]) => void;
}

const ContextoAvisos = createContext<ValorContextoAvisos | null>(null);

const buscarAvisos = (signal: AbortSignal) => avisoService.listar(signal);

export function ProvedorAvisos({ children }: { children: ReactNode }) {
  const [versao, setVersao] = useState(0);
  const [locais, setLocais] = useState<AvisoDTO[] | null>(null);
  const { dados, carregando, erro } = useDadosAssincronos(buscarAvisos, [versao]);

  useEffect(() => {
    setLocais(null);
  }, [dados]);

  const avisos = locais ?? dados;

  const atualizarAvisos = useCallback(() => setVersao((valor) => valor + 1), []);

  const substituirAviso = useCallback(
    (atualizado: AvisoDTO) =>
      setLocais((atuais) => (atuais ?? dados ?? []).map((aviso) => (aviso.id === atualizado.id ? atualizado : aviso))),
    [dados],
  );

  const substituirAvisos = useCallback((lista: AvisoDTO[]) => setLocais(lista), []);

  const value = useMemo(
    () => ({ avisos, carregando, erro, atualizarAvisos, substituirAviso, substituirAvisos }),
    [avisos, carregando, erro, atualizarAvisos, substituirAviso, substituirAvisos],
  );

  return <ContextoAvisos.Provider value={value}>{children}</ContextoAvisos.Provider>;
}

export function useAvisos(): ValorContextoAvisos {
  const context = useContext(ContextoAvisos);
  if (!context) throw new Error('useAvisos precisa estar dentro de ProvedorAvisos.');
  return context;
}
