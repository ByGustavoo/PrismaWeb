import { useEffect, useState } from 'react';

export function useConsultaMidia(query: string): boolean {
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

export const useEhMobile = () => useConsultaMidia('(max-width: 767px)');
export const useEhTablet = () => useConsultaMidia('(max-width: 1099px)');

export const useEhCompacto = () => useConsultaMidia('(max-width: 899px)');
