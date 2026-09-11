import { useCallback, useEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';

interface EstadoAssincrono<T> {
  dados: T | null;
  carregando: boolean;
  erro: Error | null;
}

export interface ResultadoAssincrono<T> extends EstadoAssincrono<T> {
  recarregar: () => void;
}

export function useDadosAssincronos<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList = [],
): ResultadoAssincrono<T> {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [state, setState] = useState<EstadoAssincrono<T>>({ dados: null, carregando: true, erro: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((previous) => ({ ...previous, carregando: true, erro: null }));

    fetcherRef
      .current(controller.signal)
      .then((dados) => {
        if (active) setState({ dados, carregando: false, erro: null });
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        setState({
          dados: null,
          carregando: false,
          erro: error instanceof Error ? error : new Error('Erro inesperado'),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [...deps, nonce]);

  const recarregar = useCallback(() => setNonce((value) => value + 1), []);

  return { ...state, recarregar };
}
