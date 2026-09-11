import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PeriodoDashboard } from '@/services';
import { chaveMesPorDeslocamento, mesesEntre, deslocarChaveMes } from '@/utils/data';

interface ValorContextoPeriodo {
  periodo: PeriodoDashboard;
  definirPeriodo: (period: PeriodoDashboard) => void;
  deslocarPeriodo: (direction: number) => void;
}

const ContextoPeriodo = createContext<ValorContextoPeriodo | null>(null);

function periodoMesAtual(): PeriodoDashboard {
  const month = chaveMesPorDeslocamento(0);
  return { dataInicial: month, dataFinal: month };
}

export function ProvedorPeriodo({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<PeriodoDashboard>(periodoMesAtual);

  const shiftPeriod = useCallback((direction: number) => {
    setPeriod((current) => {
      const step = direction * mesesEntre(current.dataInicial, current.dataFinal);
      return { dataInicial: deslocarChaveMes(current.dataInicial, step), dataFinal: deslocarChaveMes(current.dataFinal, step) };
    });
  }, []);

  const value = useMemo(() => ({ periodo: period, definirPeriodo: setPeriod, deslocarPeriodo: shiftPeriod }), [period, shiftPeriod]);

  return <ContextoPeriodo.Provider value={value}>{children}</ContextoPeriodo.Provider>;
}

export function usePeriodo(): ValorContextoPeriodo {
  const context = useContext(ContextoPeriodo);
  if (!context) throw new Error('usePeriodo precisa estar dentro de ProvedorPeriodo.');
  return context;
}
