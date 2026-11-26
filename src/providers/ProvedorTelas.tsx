import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CHAVE_TELAS_OCULTAS } from '@/constants/aplicacao';
import { rotuloTela, telaDoDestino } from '@/constants/tela/tela';
import { telaService } from '@/services';
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

function ehTela(valor: unknown): valor is Tela {
  return typeof valor === 'string' && valor in rotuloTela;
}

function lerTelasGuardadas(): Tela[] | null {
  try {
    const guardado = window.localStorage.getItem(CHAVE_TELAS_OCULTAS);
    if (guardado === null) return null;
    const telas: unknown = JSON.parse(guardado);
    return Array.isArray(telas) && telas.every(ehTela) ? telas : null;
  } catch {
    return null;
  }
}

function guardarTelas(telas: Tela[]): void {
  try {
    window.localStorage.setItem(CHAVE_TELAS_OCULTAS, JSON.stringify(telas));
  } catch {
    return;
  }
}

export function ProvedorTelas({ children }: { children: ReactNode }) {
  const toast = useNotificacoes();
  const [guardadas] = useState(lerTelasGuardadas);
  const [telasOcultas, setTelasOcultas] = useState<Tela[]>(guardadas ?? []);
  const [carregado, setCarregado] = useState(guardadas !== null);
  const [erro, setErro] = useState<Error | null>(null);
  const [estadoGravacao, setEstadoGravacao] = useState<EstadoGravacaoTelas>('parado');
  const [versao, setVersao] = useState(0);
  const atuais = useRef<Tela[]>(guardadas ?? []);
  const fila = useRef<Promise<unknown>>(Promise.resolve());
  const pendentes = useRef(0);

  useEffect(() => {
    const controle = new AbortController();

    telaService
      .buscarOcultas(controle.signal)
      .then((resposta) => {
        atuais.current = resposta.telas;
        guardarTelas(resposta.telas);
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
      guardarTelas(proximas);
      setTelasOcultas(proximas);
      setEstadoGravacao('salvando');
      pendentes.current += 1;

      fila.current = fila.current
        .then(() => telaService.atualizarOcultas({ telas: proximas }))
        .catch((causa: unknown) => {
          atuais.current = anteriores;
          guardarTelas(anteriores);
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
