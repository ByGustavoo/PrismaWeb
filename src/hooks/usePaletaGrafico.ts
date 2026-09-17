import { useMemo } from 'react';
import { TOKENS_PALETA } from '@/constants/cores';
import { useTema } from '@/providers/ProvedorTema';

export interface PaletaGrafico {
  grade: string;
  superficie: string;
  superficieSuave: string;
  borda: string;
  textoEixo: string;
  series: string[];
  paleta: string[];
}

export function usePaletaGrafico(): PaletaGrafico {
  const { tema } = useTema();

  return useMemo(() => {
    const computed = getComputedStyle(document.documentElement);
    const read = (token: string) => computed.getPropertyValue(token).trim();

    return {
      grade: read('--chart-grid'),
      superficie: read('--surface'),
      superficieSuave: read('--surface-muted'),
      borda: read('--border-strong'),
      textoEixo: read('--text-subtle'),
      series: [1, 2, 3, 4, 5, 6, 7, 8].map((index) => read(`--chart-${index}`)),
      paleta: TOKENS_PALETA.map((token) => read(`--palette-${token}`)),
    };
  }, [tema]);
}
