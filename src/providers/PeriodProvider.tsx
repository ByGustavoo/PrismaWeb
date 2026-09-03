import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { DashboardPeriod } from '@/services';
import { monthKeyFromOffset, monthsBetween, shiftMonthKey } from '@/utils/date';

interface PeriodContextValue {
  period: DashboardPeriod;
  setPeriod: (period: DashboardPeriod) => void;
  /** Desloca a janela inteira: de "maio a agosto" chega-se a "janeiro a abril". */
  shiftPeriod: (direction: number) => void;
}

const PeriodContext = createContext<PeriodContextValue | null>(null);

function currentMonthPeriod(): DashboardPeriod {
  const month = monthKeyFromOffset(0);
  return { from: month, to: month };
}

/**
 * Recorte de tempo do dashboard, escolhido no header e consumido pela tela.
 *
 * Ele vive em memoria, e nao na URL: o endereco de uma tela diz que tela e, nao
 * qual filtro esta aberto nela. Como consequencia, recarregar a pagina volta ao
 * mes corrente — que e o ponto de partida esperado de quem abre o app.
 */
export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<DashboardPeriod>(currentMonthPeriod);

  const shiftPeriod = useCallback((direction: number) => {
    setPeriod((current) => {
      const step = direction * monthsBetween(current.from, current.to);
      return { from: shiftMonthKey(current.from, step), to: shiftMonthKey(current.to, step) };
    });
  }, []);

  const value = useMemo(() => ({ period, setPeriod, shiftPeriod }), [period, shiftPeriod]);

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod(): PeriodContextValue {
  const context = useContext(PeriodContext);
  if (!context) throw new Error('usePeriod precisa estar dentro de PeriodProvider.');
  return context;
}
