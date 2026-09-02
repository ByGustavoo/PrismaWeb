import { useMemo } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

export interface ChartPalette {
  grid: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  axisText: string;
  series: string[];
}

/**
 * Recharts escreve as cores como atributos de SVG, onde `var(--token)` nao e
 * resolvido de forma confiavel. Este hook le os tokens do tema e devolve os
 * valores ja calculados, recalculando sempre que o tema muda.
 */
export function useChartPalette(): ChartPalette {
  const { theme } = useTheme();

  return useMemo(() => {
    const computed = getComputedStyle(document.documentElement);
    const read = (token: string) => computed.getPropertyValue(token).trim();

    return {
      grid: read('--chart-grid'),
      surface: read('--surface'),
      surfaceMuted: read('--surface-muted'),
      border: read('--border-strong'),
      axisText: read('--text-subtle'),
      series: [1, 2, 3, 4, 5, 6].map((index) => read(`--chart-${index}`)),
    };
  }, [theme]);
}
