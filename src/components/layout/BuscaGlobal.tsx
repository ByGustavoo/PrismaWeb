import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { KeyboardEvent } from 'react';
import { CornerDownLeft, CreditCard, Search, Tag, Wallet, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { iconePorTipo, sinalPorTipo, tomPorTipo } from '@/components/lancamentos';
import { IndicadorGiratorio } from '@/components/ui';
import { rotuloPluralTipoLancamento } from '@/constants/lancamentos';
import { contasService, categoriasService, lancamentosService } from '@/services';
import { PARAMETRO_CONTA, PARAMETRO_CATEGORIA, PARAMETRO_EDITAR_LANCAMENTO, PARAMETRO_BUSCA, caminhos } from '@/routes/caminhos';
import type { CategoriaDTO, LancamentoDTO, OrigemDTO } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { normalizarBusca, formatarDataCurta } from '@/utils/formatacao';
import styles from './BuscaGlobal.module.css';

const LIMITES = { transaction: 5, category: 3, account: 4 };

const ESPERA_ENTRE_TECLAS_MS = 250;

type GrupoResultado = 'transaction' | 'category' | 'account' | 'all';

interface ResultadoBusca {
  chave: string;
  grupo: GrupoResultado;
  rotulo: string;
  dica: string;
  destino: string;
  icone: LucideIcon;
  lancamento?: LancamentoDTO;
}

interface Catalogo {
  lancamentos: LancamentoDTO[];
  categorias: CategoriaDTO[];
  origens: OrigemDTO[];
}

interface CatalogoFixo {
  categorias: CategoriaDTO[];
  origens: OrigemDTO[];
}

const catalogoVazio: CatalogoFixo = { categorias: [], origens: [] };

const rotuloGrupo: Record<GrupoResultado, string> = {
  transaction: 'Lançamentos',
  category: 'Categorias',
  account: 'Contas e cartões',
  all: '',
};

function montarResultados(catalog: Catalogo, term: string): ResultadoBusca[] {
  const needle = normalizarBusca(term);
  const matches = (...fields: Array<string | undefined | null>) =>
    fields.some((field) => (field ? normalizarBusca(field).includes(needle) : false));

  const transactionResults = catalog.lancamentos
    .filter((item) => matches(item.descricao, item.observacoes, item.categoria?.nome, item.nomeOrigem, item.nomeContaDestino))
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, LIMITES.transaction)
    .map<ResultadoBusca>((item) => ({
      chave: `transaction-${item.id}`,
      grupo: 'transaction',
      rotulo: item.descricao,
      dica: `${formatarDataCurta(item.data)} · ${item.nomeOrigem}`,
      destino: `${caminhos.lancamentos}?${PARAMETRO_EDITAR_LANCAMENTO}=${item.id}`,
      icone: iconePorTipo[item.tipo],
      lancamento: item,
    }));

  const categoryResults = catalog.categorias
    .filter((item) => matches(item.nome))
    .slice(0, LIMITES.category)
    .map<ResultadoBusca>((item) => ({
      chave: `category-${item.id}`,
      grupo: 'category',
      rotulo: item.nome,
      dica: rotuloPluralTipoLancamento[item.tipo],
      destino: `${caminhos.lancamentos}?${PARAMETRO_CATEGORIA}=${item.id}`,
      icone: Tag,
    }));

  const accountResults = catalog.origens
    .filter((item) => matches(item.nome))
    .slice(0, LIMITES.account)
    .map<ResultadoBusca>((item) => ({
      chave: `account-${item.id}`,
      grupo: 'account',
      rotulo: item.nome,
      dica: item.grupo === 'CARTAO' ? 'Cartão de crédito' : 'Conta',
      destino: `${caminhos.lancamentos}?${PARAMETRO_CONTA}=${item.id}`,
      icone: item.grupo === 'CARTAO' ? CreditCard : Wallet,
    }));

  return [...transactionResults, ...categoryResults, ...accountResults];
}

interface BuscaGlobalProps {
  expandido?: boolean;
  aoRecolher?: () => void;
}

export function BuscaGlobal({ expandido = false, aoRecolher }: BuscaGlobalProps) {
  const navigate = useNavigate();
  const baseId = useId();
  const listId = `${baseId}-list`;

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [term, setTerm] = useState('');
  const [focused, setFocused] = useState(false);
  const [fixedCatalog, setFixedCatalog] = useState<CatalogoFixo>(catalogoVazio);
  const [transactions, setTransactions] = useState<LancamentoDTO[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmed = term.trim();

  useEffect(() => {
    if (!focused) return;

    const controller = new AbortController();
    setLoadingCatalog(true);

    Promise.all([categoriasService.listar(undefined, controller.signal), contasService.listarOrigens(controller.signal)])
      .then(([categorias, origens]) => {
        if (!controller.signal.aborted) setFixedCatalog({ categorias, origens });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCatalog(false);
      });

    return () => controller.abort();
  }, [focused]);

  useEffect(() => {
    if (!focused || !trimmed) {
      setTransactions([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    const timer = setTimeout(() => {
      lancamentosService
        .listar({ busca: trimmed }, controller.signal)
        .then((found) => {
          if (!controller.signal.aborted) setTransactions(found);
        })
        .catch(() => undefined)
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, ESPERA_ENTRE_TECLAS_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [focused, trimmed]);

  useEffect(() => {
    if (expandido) inputRef.current?.focus();
  }, [expandido]);

  const loading = loadingCatalog || searching;

  const results = useMemo(
    () => (trimmed ? montarResultados({ ...fixedCatalog, lancamentos: transactions }, trimmed) : []),
    [fixedCatalog, transactions, trimmed],
  );

  const seeAll = useMemo<ResultadoBusca>(
    () => ({
      chave: 'all',
      grupo: 'all',
      rotulo: `Ver todos os lançamentos com "${trimmed}"`,
      dica: '',
      destino: `${caminhos.lancamentos}?${PARAMETRO_BUSCA}=${encodeURIComponent(trimmed)}`,
      icone: Search,
    }),
    [trimmed],
  );

  const items = useMemo(() => [...results, seeAll], [results, seeAll]);
  const open = focused && trimmed !== '';

  useEffect(() => setActiveIndex(0), [trimmed]);

  const collapse = useCallback(() => {
    setTerm('');
    setFocused(false);
    aoRecolher?.();
  }, [aoRecolher]);

  const go = useCallback(
    (result: ResultadoBusca | undefined) => {
      if (!result) return;
      setTerm('');
      setFocused(false);
      inputRef.current?.blur();
      aoRecolher?.();
      navigate(result.destino);
    },
    [navigate, aoRecolher],
  );

  useEffect(() => {
    if (!open && !expandido) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setFocused(false);
      if (expandido) aoRecolher?.();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, expandido, aoRecolher]);

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        if (!open) return;
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, items.length - 1));
        return;
      case 'ArrowUp':
        if (!open) return;
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      case 'Enter':
        if (!open) return;
        event.preventDefault();
        go(items[activeIndex]);
        return;
      case 'Escape':
        event.preventDefault();
        if (open) setFocused(false);
        else collapse();
        return;
      case 'Tab':
        setFocused(false);
        return;
      default:
    }
  };

  let lastGroup: GrupoResultado | null = null;

  return (
    <div className={juntarClasses(styles.root, expandido && styles.rootExpanded)} ref={rootRef}>
      <div className={juntarClasses(styles.field, open && styles.fieldOpen)}>
        <Search size={16} strokeWidth={2} className={styles.fieldIcon} aria-hidden="true" />

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar lançamento, conta ou categoria"
          aria-label="Buscar"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? `${baseId}-option-${activeIndex}` : undefined}
        />

        {open && loading ? <IndicadorGiratorio tamanho={14} /> : null}

        {expandido ? (
          <button type="button" className={styles.collapse} onClick={collapse} aria-label="Fechar busca">
            <X size={16} strokeWidth={2} />
          </button>
        ) : null}
      </div>

      {open ? (
        <ul className={styles.panel} id={listId} role="listbox" aria-label="Resultados da busca">
          {results.length === 0 && !loading ? (
            <li className={styles.empty} role="presentation">
              Nenhum resultado para "{trimmed}".
            </li>
          ) : null}

          {items.map((result, index) => {
            const header = result.grupo !== 'all' && result.grupo !== lastGroup ? result.grupo : null;
            lastGroup = result.grupo;

            const Icon = result.icone;
            const isActive = index === activeIndex;

            return (
              <Fragment key={result.chave}>
                {header ? (
                  <li className={styles.groupLabel} role="presentation">
                    {rotuloGrupo[header]}
                  </li>
                ) : null}

                <li
                  id={`${baseId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive}
                  className={juntarClasses(
                    styles.option,
                    result.grupo === 'all' && styles.optionAll,
                    isActive && styles.optionActive,
                  )}
                  onPointerEnter={() => setActiveIndex(index)}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    go(result);
                  }}
                >
                  <Icon className={styles.optionIcon} size={15} strokeWidth={2} aria-hidden="true" />

                  <span className={styles.optionText}>
                    <span className={styles.optionLabel}>{result.rotulo}</span>
                    {result.dica ? <span className={styles.optionHint}>{result.dica}</span> : null}
                  </span>

                  {result.lancamento ? (
                    <ValorMonetario
                      valor={result.lancamento.valor}
                      tamanho="sm"
                      tom={tomPorTipo[result.lancamento.tipo]}
                      sinal={sinalPorTipo[result.lancamento.tipo]}
                    />
                  ) : null}

                  {result.grupo === 'all' ? (
                    <CornerDownLeft className={styles.optionIcon} size={14} strokeWidth={2} aria-hidden="true" />
                  ) : null}
                </li>
              </Fragment>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
