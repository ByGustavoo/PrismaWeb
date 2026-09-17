import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ItemNotificacao, AreaNotificacoes } from '@/components/ui';
import type { MensagemNotificacao, VarianteNotificacao } from '@/components/ui';
import {
  CARACTERES_LEITURA_BASE_NOTIFICACAO,
  DESCRICAO_ERRO_PADRAO_NOTIFICACAO,
  DURACAO_MAXIMA_NOTIFICACAO_MS,
  DURACAO_SAIDA_NOTIFICACAO_MS,
  MS_POR_CARACTERE_EXTRA_NOTIFICACAO,
  NOTIFICACOES_VISIVEIS_MAXIMO,
  duracaoBaseNotificacao,
} from '@/constants/notificacoes';

export interface EntradaNotificacao {
  titulo: string;
  descricao?: string;
  variante?: VarianteNotificacao;
}

interface ValorContextoNotificacoes {
  notificar: (notificacao: EntradaNotificacao) => void;
  sucesso: (titulo: string, descricao?: string) => void;
  aviso: (titulo: string, descricao?: string) => void;
  informacao: (titulo: string, descricao?: string) => void;
  erro: (titulo: string, causa?: unknown) => void;
  dispensar: (id: string) => void;
}

const ContextoNotificacoes = createContext<ValorContextoNotificacoes | null>(null);

function calcularDuracao(variante: VarianteNotificacao, titulo: string, descricao?: string): number {
  const caracteres = titulo.length + (descricao?.length ?? 0);
  const extra = Math.max(0, caracteres - CARACTERES_LEITURA_BASE_NOTIFICACAO) * MS_POR_CARACTERE_EXTRA_NOTIFICACAO;
  return Math.min(duracaoBaseNotificacao[variante] + extra, DURACAO_MAXIMA_NOTIFICACAO_MS);
}

function descreverCausa(causa: unknown): string {
  if (typeof causa === 'string' && causa.trim()) return causa;
  if (causa instanceof Error && causa.message.trim()) return causa.message;
  return DESCRICAO_ERRO_PADRAO_NOTIFICACAO;
}

function marcarSaida(lista: MensagemNotificacao[], ids: Set<string>): MensagemNotificacao[] {
  return lista.map((item) => (ids.has(item.id) && !item.saindo ? { ...item, saindo: true } : item));
}

export function ProvedorNotificacoes({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<MensagemNotificacao[]>([]);
  const [pausado, setPausado] = useState(false);
  const remocoes = useRef(new Map<string, number>());

  useEffect(() => {
    notificacoes.forEach((item) => {
      if (!item.saindo || remocoes.current.has(item.id)) return;
      const timer = window.setTimeout(() => {
        remocoes.current.delete(item.id);
        setNotificacoes((atual) => atual.filter((outra) => outra.id !== item.id));
      }, DURACAO_SAIDA_NOTIFICACAO_MS);
      remocoes.current.set(item.id, timer);
    });
  }, [notificacoes]);

  useEffect(() => {
    const pendentes = remocoes.current;
    return () => {
      pendentes.forEach((timer) => window.clearTimeout(timer));
      pendentes.clear();
    };
  }, []);

  const dispensar = useCallback((id: string) => {
    setNotificacoes((atual) => marcarSaida(atual, new Set([id])));
  }, []);

  const notificar = useCallback(({ titulo, descricao, variante = 'info' }: EntradaNotificacao) => {
    const duracao = calcularDuracao(variante, titulo, descricao);

    setNotificacoes((atual) => {
      const repetida = atual.find(
        (item) => !item.saindo && item.variante === variante && item.titulo === titulo && item.descricao === descricao,
      );
      if (repetida) {
        return atual.map((item) => (item === repetida ? { ...item, duracao, versao: item.versao + 1 } : item));
      }

      const nova: MensagemNotificacao = {
        id: crypto.randomUUID(),
        titulo,
        variante,
        duracao,
        versao: 0,
        saindo: false,
        ...(descricao ? { descricao } : {}),
      };
      const ativas = atual.filter((item) => !item.saindo);
      const excedentes = ativas.slice(0, Math.max(0, ativas.length + 1 - NOTIFICACOES_VISIVEIS_MAXIMO));
      return [...marcarSaida(atual, new Set(excedentes.map((item) => item.id))), nova];
    });
  }, []);

  const sucesso = useCallback(
    (titulo: string, descricao?: string) => notificar({ titulo, variante: 'success', ...(descricao ? { descricao } : {}) }),
    [notificar],
  );

  const aviso = useCallback(
    (titulo: string, descricao?: string) => notificar({ titulo, variante: 'warning', ...(descricao ? { descricao } : {}) }),
    [notificar],
  );

  const informacao = useCallback(
    (titulo: string, descricao?: string) => notificar({ titulo, variante: 'info', ...(descricao ? { descricao } : {}) }),
    [notificar],
  );

  const erro = useCallback(
    (titulo: string, causa?: unknown) => notificar({ titulo, variante: 'error', descricao: descreverCausa(causa) }),
    [notificar],
  );

  const valor = useMemo<ValorContextoNotificacoes>(
    () => ({ notificar, sucesso, aviso, informacao, erro, dispensar }),
    [notificar, sucesso, aviso, informacao, erro, dispensar],
  );

  return (
    <ContextoNotificacoes.Provider value={valor}>
      {children}
      <AreaNotificacoes quantidade={notificacoes.length} aoPausar={setPausado}>
        {notificacoes.map((item) => (
          <ItemNotificacao key={item.id} notificacao={item} pausado={pausado} aoDispensar={dispensar} />
        ))}
      </AreaNotificacoes>
    </ContextoNotificacoes.Provider>
  );
}

export function useNotificacoes(): ValorContextoNotificacoes {
  const contexto = useContext(ContextoNotificacoes);
  if (!contexto) {
    throw new Error('useNotificacoes precisa estar dentro de <ProvedorNotificacoes>.');
  }
  return contexto;
}
