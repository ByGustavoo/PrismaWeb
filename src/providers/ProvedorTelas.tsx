import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { rotuloTela, telaDoDestino } from '@/constants/telas';
import { telasService } from '@/services';
import type { Tela } from '@/types';
import { useNotificacoes } from './ProvedorNotificacoes';

export type EstadoGravacaoTelas = 'parado' | 'salvando' | 'salvo';

interface ValorContextoTelas {
  telasOcultas: Tela[];
  carregado: boolean;
  erro: Error | null;
  estadoGravacao: EstadoGravacaoTelas;
  estaOculto: (destino: string) => boolean;
  definirOculta: (tela: Tela, oculta: boolean) => void;
  mostrarTodas: () => void;
  recarregar: () => void;
}

const ContextoTelas = createContext<ValorContextoTelas | null>(null);

export function ProvedorTelas({ children }: { children: ReactNode }) {
  const toast = useNotificacoes();
  const [telasOcultas, setTelasOcultas] = useState<Tela[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState<Error | null>(null);
  const [estadoGravacao, setEstadoGravacao] = useState<EstadoGravacaoTelas>('parado');
  const [versao, setVersao] = useState(0);
  const atuais = useRef<Tela[]>([]);
  const fila = useRef<Promise<unknown>>(Promise.resolve());
  const pendentes = useRef(0);

  useEffect(() => {
    const controle = new AbortController();

    telasService
      .buscarOcultas(controle.signal)
      .then((resposta) => {
        atuais.current = resposta.telas;
        setTelasOcultas(resposta.telas);
        setErro(null);
        setCarregado(true);
      })
      .catch((causa: unknown) => {
        if (controle.signal.aborted) return;
        setErro(causa instanceof Error ? causa : new Error('Não foi possível carregar as telas ocultas.'));
        setCarregado(true);
      });

    return () => controle.abort();
  }, [versao]);

  const recarregar = useCallback(() => setVersao((valor) => valor + 1), []);

  const estaOculto = useCallback(
    (destino: string) => {
      const tela = telaDoDestino(destino);
      return tela !== null && telasOcultas.includes(tela);
    },
    [telasOcultas],
  );

  const salvar = useCallback(
    (proximas: Tela[], mensagemErro: string) => {
      const anteriores = atuais.current;

      atuais.current = proximas;
      setTelasOcultas(proximas);
      setEstadoGravacao('salvando');
      pendentes.current += 1;

      fila.current = fila.current
        .then(() => telasService.atualizarOcultas({ telas: proximas }))
        .catch((causa: unknown) => {
          atuais.current = anteriores;
          setTelasOcultas(anteriores);
          toast.erro(mensagemErro, causa);
        })
        .finally(() => {
          pendentes.current -= 1;
          if (pendentes.current === 0) setEstadoGravacao('salvo');
        });
    },
    [toast],
  );

  const definirOculta = useCallback(
    (tela: Tela, oculta: boolean) => {
      const outras = atuais.current.filter((item) => item !== tela);
      salvar(
        oculta ? [...outras, tela] : outras,
        oculta ? `Não foi possível ocultar ${rotuloTela[tela]}.` : `Não foi possível mostrar ${rotuloTela[tela]}.`,
      );
    },
    [salvar],
  );

  const mostrarTodas = useCallback(() => salvar([], 'Não foi possível mostrar as telas ocultas.'), [salvar]);

  const valor = useMemo(
    () => ({ telasOcultas, carregado, erro, estadoGravacao, estaOculto, definirOculta, mostrarTodas, recarregar }),
    [telasOcultas, carregado, erro, estadoGravacao, estaOculto, definirOculta, mostrarTodas, recarregar],
  );

  return <ContextoTelas.Provider value={valor}>{children}</ContextoTelas.Provider>;
}

export function useTelas(): ValorContextoTelas {
  const contexto = useContext(ContextoTelas);
  if (!contexto) throw new Error('useTelas precisa estar dentro de ProvedorTelas.');
  return contexto;
}
