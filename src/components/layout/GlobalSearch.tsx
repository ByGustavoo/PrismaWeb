import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { KeyboardEvent } from 'react';
import { CornerDownLeft, CreditCard, Search, Tag, Wallet, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Amount } from '@/components/common';
import { kindIcon, kindSign, kindTone } from '@/components/transactions';
import { Spinner } from '@/components/ui';
import { transactionKindPluralLabel } from '@/constants/transactions';
import { accountsService, categoriesService, transactionsService } from '@/services';
import { ACCOUNT_PARAM, CATEGORY_PARAM, EDIT_TRANSACTION_PARAM, SEARCH_PARAM, paths } from '@/routes/paths';
import type { Category, PaymentSource, Transaction } from '@/types';
import { cn } from '@/utils/cn';
import { formatShortDate } from '@/utils/format';
import styles from './GlobalSearch.module.css';

/** Quantos itens cada grupo mostra antes de sobrar para "ver todos". */
const LIMITS = { transaction: 5, category: 3, account: 4 };

type ResultGroup = 'transaction' | 'category' | 'account' | 'all';

interface SearchResult {
  key: string;
  group: ResultGroup;
  label: string;
  hint: string;
  to: string;
  icon: LucideIcon;
  /** Presente so nos lancamentos, que mostram o valor a direita. */
  transaction?: Transaction;
}

interface Catalog {
  transactions: Transaction[];
  categories: Category[];
  sources: PaymentSource[];
}

const emptyCatalog: Catalog = { transactions: [], categories: [], sources: [] };

const groupLabel: Record<ResultGroup, string> = {
  transaction: 'Lançamentos',
  category: 'Categorias',
  account: 'Contas e cartões',
  all: '',
};

/** Sem acento e sem caixa: quem digita "saude" espera achar "Saúde". */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function buildResults(catalog: Catalog, term: string): SearchResult[] {
  const needle = fold(term);
  const matches = (...fields: Array<string | undefined | null>) =>
    fields.some((field) => (field ? fold(field).includes(needle) : false));

  const transactionResults = catalog.transactions
    .filter((item) => matches(item.description, item.notes, item.category?.name, item.accountName, item.toAccountName))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, LIMITS.transaction)
    .map<SearchResult>((item) => ({
      key: `transaction-${item.id}`,
      group: 'transaction',
      label: item.description,
      hint: `${formatShortDate(item.date)} · ${item.accountName}`,
      to: `${paths.transactions}?${EDIT_TRANSACTION_PARAM}=${item.id}`,
      icon: kindIcon[item.kind],
      transaction: item,
    }));

  const categoryResults = catalog.categories
    .filter((item) => matches(item.name))
    .slice(0, LIMITS.category)
    .map<SearchResult>((item) => ({
      key: `category-${item.id}`,
      group: 'category',
      label: item.name,
      hint: transactionKindPluralLabel[item.kind],
      to: `${paths.transactions}?${CATEGORY_PARAM}=${item.id}`,
      icon: Tag,
    }));

  const accountResults = catalog.sources
    .filter((item) => matches(item.name))
    .slice(0, LIMITS.account)
    .map<SearchResult>((item) => ({
      key: `account-${item.id}`,
      group: 'account',
      label: item.name,
      hint: item.group === 'card' ? 'Cartão de crédito' : 'Conta',
      to: `${paths.transactions}?${ACCOUNT_PARAM}=${item.id}`,
      icon: item.group === 'card' ? CreditCard : Wallet,
    }));

  return [...transactionResults, ...categoryResults, ...accountResults];
}

interface GlobalSearchProps {
  /**
   * Em tela estreita o campo fica escondido e so aparece quando o header pede.
   * No desktop a prop e ignorada: o campo ja esta sempre visivel.
   */
  expanded?: boolean;
  onCollapse?: () => void;
}

/**
 * Busca do header. Procura em lancamentos, categorias e contas ao mesmo tempo e
 * entrega cada resultado como um destino: o lancamento abre a propria edicao, e
 * a categoria e a conta abrem a listagem ja filtrada por elas.
 *
 * O catalogo e recarregado sempre que o campo recebe foco — um lancamento
 * cadastrado ha pouco precisa aparecer na busca seguinte — e a filtragem roda em
 * memoria, para responder a cada tecla sem uma nova ida ao servidor.
 */
export function GlobalSearch({ expanded = false, onCollapse }: GlobalSearchProps) {
  const navigate = useNavigate();
  const baseId = useId();
  const listId = `${baseId}-list`;

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [term, setTerm] = useState('');
  const [focused, setFocused] = useState(false);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!focused) return;

    const controller = new AbortController();
    setLoading(true);

    Promise.all([
      transactionsService.list({}, controller.signal),
      categoriesService.list(undefined, controller.signal),
      accountsService.listSources(controller.signal),
    ])
      .then(([transactions, categories, sources]) => {
        if (!controller.signal.aborted) setCatalog({ transactions, categories, sources });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [focused]);

  // Abrir a busca no celular precisa levar o cursor junto, senao o teclado do
  // aparelho nao sobe e o campo aparece pedindo mais um toque.
  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  const trimmed = term.trim();
  const results = useMemo(() => (trimmed ? buildResults(catalog, trimmed) : []), [catalog, trimmed]);

  // A ultima linha e sempre um destino valido, mesmo sem nenhuma correspondencia.
  const seeAll = useMemo<SearchResult>(
    () => ({
      key: 'all',
      group: 'all',
      label: `Ver todos os lançamentos com "${trimmed}"`,
      hint: '',
      to: `${paths.transactions}?${SEARCH_PARAM}=${encodeURIComponent(trimmed)}`,
      icon: Search,
    }),
    [trimmed],
  );

  const items = useMemo(() => [...results, seeAll], [results, seeAll]);
  const open = focused && trimmed !== '';

  useEffect(() => setActiveIndex(0), [trimmed]);

  const collapse = useCallback(() => {
    setTerm('');
    setFocused(false);
    onCollapse?.();
  }, [onCollapse]);

  const go = useCallback(
    (result: SearchResult | undefined) => {
      if (!result) return;
      setTerm('');
      setFocused(false);
      inputRef.current?.blur();
      onCollapse?.();
      navigate(result.to);
    },
    [navigate, onCollapse],
  );

  // Fecha ao clicar fora sem roubar o clique do alvo.
  useEffect(() => {
    if (!open && !expanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setFocused(false);
      if (expanded) onCollapse?.();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, expanded, onCollapse]);

  // Mantem o item ativo visivel durante a navegacao pelo teclado.
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
        // Primeiro Escape fecha a lista; o segundo limpa o campo (e, no celular,
        // fecha a propria busca).
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

  let lastGroup: ResultGroup | null = null;

  return (
    <div className={cn(styles.root, expanded && styles.rootExpanded)} ref={rootRef}>
      <div className={cn(styles.field, open && styles.fieldOpen)}>
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

        {open && loading ? <Spinner size={14} /> : null}

        {expanded ? (
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
            const header = result.group !== 'all' && result.group !== lastGroup ? result.group : null;
            lastGroup = result.group;

            const Icon = result.icon;
            const isActive = index === activeIndex;

            return (
              <Fragment key={result.key}>
                {header ? (
                  <li className={styles.groupLabel} role="presentation">
                    {groupLabel[header]}
                  </li>
                ) : null}

                <li
                  id={`${baseId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive}
                  className={cn(
                    styles.option,
                    result.group === 'all' && styles.optionAll,
                    isActive && styles.optionActive,
                  )}
                  onPointerEnter={() => setActiveIndex(index)}
                  // O ponteiro precisa agir antes do blur do campo, que fecharia o painel.
                  onPointerDown={(event) => {
                    event.preventDefault();
                    go(result);
                  }}
                >
                  <Icon className={styles.optionIcon} size={15} strokeWidth={2} aria-hidden="true" />

                  <span className={styles.optionText}>
                    <span className={styles.optionLabel}>{result.label}</span>
                    {result.hint ? <span className={styles.optionHint}>{result.hint}</span> : null}
                  </span>

                  {result.transaction ? (
                    <Amount
                      value={result.transaction.amount}
                      size="sm"
                      tone={kindTone[result.transaction.kind]}
                      sign={kindSign[result.transaction.kind]}
                    />
                  ) : null}

                  {result.group === 'all' ? (
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
