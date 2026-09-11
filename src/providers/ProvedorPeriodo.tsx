import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PeriodoDashboard } from '@/services';
import { chaveMesPorDeslocamento } from '@/utils/data';

interface ValorContextoPeriodo {
  periodo: PeriodoDashboard;
  definirPeriodo: (period: PeriodoDashboard) => void;
}

const ContextoPeriodo = createContext<ValorContextoPeriodo | null>(null);

function periodoMesAtual(): PeriodoDashboard {
  const month = chaveMesPorDeslocamento(0);
  return { dataInicial: month, dataFinal: month };
}

export function ProvedorPeriodo({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<PeriodoDashboard>(periodoMesAtual);

  const value = useMemo(() => ({ periodo: period, definirPeriodo: setPeriod }), [period]);

  return <ContextoPeriodo.Provider value={value}>{children}</ContextoPeriodo.Provider>;
}

export function usePeriodo(): ValorContextoPeriodo {
  const context = useContext(ContextoPeriodo);
  if (!context) throw new Error('usePeriodo precisa estar dentro de ProvedorPeriodo.');
  return context;
}
