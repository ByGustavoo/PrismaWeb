import { useCallback, useEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface AsyncResult<T> extends AsyncState<T> {
  reload: () => void;
}

export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList = [],
): AsyncResult<T> {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Erro inesperado'),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { ...state, reload };
}
