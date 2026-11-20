import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function useTabelaCabe(conteudo: unknown) {
  const areaRef = useRef<HTMLDivElement>(null);
  const tabelaRef = useRef<HTMLDivElement>(null);
  const [disponivel, setDisponivel] = useState(Number.POSITIVE_INFINITY);
  const [necessaria, setNecessaria] = useState(0);
  const cabe = disponivel >= necessaria;

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setDisponivel(entry.target.getBoundingClientRect().width);
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [conteudo]);

  useLayoutEffect(() => {
    setNecessaria(0);
  }, [conteudo]);

  useLayoutEffect(() => {
    const area = areaRef.current;
    const caixa = tabelaRef.current?.querySelector('table')?.parentElement;
    if (!area || !caixa) return;
    const excesso = caixa.scrollWidth - caixa.clientWidth;
    if (excesso > 1) setNecessaria(area.getBoundingClientRect().width + excesso);
  }, [conteudo, disponivel, cabe]);

  return { areaRef, tabelaRef, cabe };
}
