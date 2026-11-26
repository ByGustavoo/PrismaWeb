import { useEffect, useLayoutEffect, useRef } from 'react';

export function useReposicionarPopover(aberto: boolean, posicionar: () => void): void {
  const posicionarRef = useRef(posicionar);
  posicionarRef.current = posicionar;

  useLayoutEffect(() => {
    if (aberto) posicionarRef.current();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    const handleReposition = () => posicionarRef.current();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [aberto]);
}
