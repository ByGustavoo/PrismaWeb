import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ItemNotificacao, AreaNotificacoes } from '@/components/ui';
import type { MensagemNotificacao, VarianteNotificacao } from '@/components/ui';

type EntradaNotificacao = Omit<MensagemNotificacao, 'id' | 'variante'> & { variante?: VarianteNotificacao };

interface ValorContextoNotificacoes {
  notificar: (toast: EntradaNotificacao) => void;
  sucesso: (title: string, description?: string) => void;
  erro: (title: string, description?: string) => void;
  dispensar: (id: string) => void;
}

const ContextoNotificacoes = createContext<ValorContextoNotificacoes | null>(null);
const TEMPO_DISPENSA_AUTOMATICA_MS = 5000;

export function ProvedorNotificacoes({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<MensagemNotificacao[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    ({ variante = 'info', ...rest }: EntradaNotificacao) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, variante, ...rest }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), TEMPO_DISPENSA_AUTOMATICA_MS));
    },
    [dismiss],
  );

  const success = useCallback(
    (titulo: string, description?: string) => notify({ titulo, variante: 'success', ...(description ? { descricao: description } : {}) }),
    [notify],
  );

  const error = useCallback(
    (titulo: string, description?: string) => notify({ titulo, variante: 'error', ...(description ? { descricao: description } : {}) }),
    [notify],
  );

  const value = useMemo<ValorContextoNotificacoes>(
    () => ({ notificar: notify, sucesso: success, erro: error, dispensar: dismiss }),
    [notify, success, error, dismiss],
  );

  return (
    <ContextoNotificacoes.Provider value={value}>
      {children}
      <AreaNotificacoes>
        {toasts.map((toast) => (
          <ItemNotificacao key={toast.id} notificacao={toast} aoDispensar={dismiss} />
        ))}
      </AreaNotificacoes>
    </ContextoNotificacoes.Provider>
  );
}

export function useNotificacoes(): ValorContextoNotificacoes {
  const context = useContext(ContextoNotificacoes);
  if (!context) {
    throw new Error('useNotificacoes precisa estar dentro de <ProvedorNotificacoes>.');
  }
  return context;
}
