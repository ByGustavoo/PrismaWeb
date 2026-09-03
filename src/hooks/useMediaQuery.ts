import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Breakpoints usados no layout. Mantidos em sincronia com o CSS. */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(max-width: 1099px)');

/**
 * Largura em que uma tabela larga deixa de caber: abaixo dela a listagem de
 * lancamentos troca a tabela por cartoes, em vez de rolar de lado.
 */
export const useIsCompact = () => useMediaQuery('(max-width: 899px)');
