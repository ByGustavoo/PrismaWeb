import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CHAVE_TEMA } from '@/constants/aplicacao';

export type ModoTema = 'light' | 'dark' | 'system';
export type TemaResolvido = 'light' | 'dark';

interface ValorContextoTema {
  modo: ModoTema;
  tema: TemaResolvido;
  definirModo: (mode: ModoTema) => void;
  alternarTema: () => void;
}

const ContextoTema = createContext<ValorContextoTema | null>(null);

function lerModoSalvo(): ModoTema {
  try {
    const stored = window.localStorage.getItem(CHAVE_TEMA);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
  }
  return 'system';
}

function temaDoSistema(): TemaResolvido {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ProvedorTema({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ModoTema>(lerModoSalvo);
  const [systemPreference, setSystemPreference] = useState<TemaResolvido>(temaDoSistema);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => setSystemPreference(event.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const theme: TemaResolvido = mode === 'system' ? systemPreference : mode;

  if (typeof document !== 'undefined' && document.documentElement.dataset.theme !== theme) {
    document.documentElement.dataset.theme = theme;
  }

  const setMode = useCallback((next: ModoTema) => {
    setModeState(next);
    try {
      window.localStorage.setItem(CHAVE_TEMA, next);
    } catch {
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(theme === 'dark' ? 'light' : 'dark');
  }, [setMode, theme]);

  const value = useMemo<ValorContextoTema>(
    () => ({ modo: mode, tema: theme, definirModo: setMode, alternarTema: toggleTheme }),
    [mode, theme, setMode, toggleTheme],
  );

  return <ContextoTema.Provider value={value}>{children}</ContextoTema.Provider>;
}

export function useTema(): ValorContextoTema {
  const context = useContext(ContextoTema);
  if (!context) {
    throw new Error('useTema precisa estar dentro de <ProvedorTema>.');
  }
  return context;
}
