import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface ValorContextoAvisos {
  versaoAvisos: number;
  atualizarAvisos: () => void;
}

const ContextoAvisos = createContext<ValorContextoAvisos | null>(null);

export function ProvedorAvisos({ children }: { children: ReactNode }) {
  const [versaoAvisos, setVersaoAvisos] = useState(0);

  const atualizarAvisos = useCallback(() => setVersaoAvisos((value) => value + 1), []);

  const value = useMemo(() => ({ versaoAvisos, atualizarAvisos }), [versaoAvisos, atualizarAvisos]);

  return <ContextoAvisos.Provider value={value}>{children}</ContextoAvisos.Provider>;
}

export function useAvisos(): ValorContextoAvisos {
  const context = useContext(ContextoAvisos);
  if (!context) throw new Error('useAvisos precisa estar dentro de ProvedorAvisos.');
  return context;
}
