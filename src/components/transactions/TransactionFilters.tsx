import { useId, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarRange, CircleDot, Search, SlidersHorizontal, Tag, Wallet, X } from 'lucide-react';
import { HeaderSlot } from '@/components/layout';
import { Button, DatePicker, Input, Select } from '@/components/ui';
import { LOCALE } from '@/constants/app';
import { transactionKindPluralLabel, transactionStatusLabel } from '@/constants/transactions';
import { useIsCompact } from '@/hooks/useMediaQuery';
import type { Option, Transaction } from '@/types';
import { cn } from '@/utils/cn';
import { ALL, hasActiveFilters, periodOptions } from './query';
import type { TransactionQuery } from './query';
import styles from './TransactionFilters.module.css';

interface TransactionFiltersProps {
  query: TransactionQuery;
  onChange: (patch: Partial<TransactionQuery>) => void;
  onClear: () => void;
  /** Lista completa da tela: as opcoes saem dela, nunca de um cadastro fixo. */
  source: Transaction[];
  /** Escondido nas telas que ja sao de um tipo so. */
  showKindFilter: boolean;
  /** Escondido em Transferencias, onde nenhum lancamento tem categoria. */
  showCategoryFilter: boolean;
}

const kindOptions: Option[] = [
  { value: ALL, label: 'Todos os tipos' },
  { value: 'income', label: transactionKindPluralLabel.income },
  { value: 'expense', label: transactionKindPluralLabel.expense },
  { value: 'transfer', label: transactionKindPluralLabel.transfer },
];

const statusOptions: Option[] = [
  { value: ALL, label: 'Todas as situações' },
  { value: 'paid', label: transactionStatusLabel.paid },
  { value: 'pending', label: transactionStatusLabel.pending },
  { value: 'scheduled', label: transactionStatusLabel.scheduled },
];

/** Quantos filtros (fora a busca) estao restringindo a lista agora. */
function countActiveFilters(query: TransactionQuery): number {
  return [query.period, query.kind, query.categoryId, query.accountId, query.status].filter(
    (value) => value !== ALL,
  ).length;
}

/** Ordena e deduplica pares id/nome vindos dos proprios dados. */
function toOptions(entries: Array<[string, string]>, allLabel: string): Option[] {
  const unique = new Map(entries);
  const sorted = [...unique.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, LOCALE));

  return [{ value: ALL, label: allLabel }, ...sorted];
}

export function TransactionFilters({
  query,
  onChange,
  onClear,
  source,
  showKindFilter,
  showCategoryFilter,
}: TransactionFiltersProps) {
  const categoryOptions = useMemo(
    () =>
      toOptions(
        source.flatMap((item) => (item.category ? [[item.category.id, item.category.name] as [string, string]] : [])),
        'Todas as categorias',
      ),
    [source],
  );

  const accountOptions = useMemo(
    () =>
      toOptions(
        source.flatMap((item) => {
          const entries: Array<[string, string]> = [[item.accountId, item.accountName]];
          if (item.toAccountId && item.toAccountName) entries.push([item.toAccountId, item.toAccountName]);
          return entries;
        }),
        'Todas as contas',
      ),
    [source],
  );

  const isCompact = useIsCompact();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const activeCount = countActiveFilters(query);
  // No desktop os filtros cabem na mesma linha da busca. No celular, cinco
  // campos empilhados empurravam o primeiro lancamento para fora da tela, entao
  // eles ficam atras de um botao que diz quantos estao ativos.
  const showControls = !isCompact || expanded;

  const search = (
    <Input
      className={styles.search}
      icon={Search}
      placeholder="Buscar nos lançamentos"
      value={query.search}
      onChange={(event) => onChange({ search: event.target.value })}
      aria-label="Buscar lançamentos"
    />
  );

  const clear = hasActiveFilters(query) ? (
    <Button className={styles.clear} variant="ghost" icon={X} onClick={onClear}>
      Limpar
    </Button>
  ) : null;

  /*
   * A busca e o "Limpar" andam juntos — o botao zera tambem o que foi digitado
   * — e mudam de lugar conforme a largura. No desktop sobem para o espaco que o
   * header reserva a tela, o mesmo em que as outras telas mostram a busca
   * global; no celular ficam na tela, ao lado do botao que abre os filtros,
   * porque la o header nao tem folga para mais um campo.
   */
  return (
    <div className={styles.filters}>
      {isCompact ? (
        <div className={styles.searchRow}>
          {search}

          {/*
            "Filtros" vem antes de "Limpar" para que a quebra caia no lugar
            certo: busca e filtros juntos na primeira linha, e o limpar —
            secundario — desce sozinho quando existe.
          */}
          <Button
            className={styles.toggle}
            variant="secondary"
            icon={SlidersHorizontal}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((value) => !value)}
          >
            Filtros
            {activeCount > 0 ? <span className={styles.count}>{activeCount}</span> : null}
          </Button>

          {clear}
        </div>
      ) : (
        <HeaderSlot>
          {search}
          {clear}
        </HeaderSlot>
      )}

      <div className={cn(styles.controls, !showControls && styles.controlsHidden)} id={panelId} hidden={!showControls}>
        <Select
          className={styles.filter}
          icon={CalendarRange}
          options={periodOptions}
          value={query.period}
          onChange={(period) => onChange({ period: period as TransactionQuery['period'] })}
          aria-label="Filtrar por período"
        />

        {showKindFilter ? (
          <Select
            className={styles.filter}
            icon={ArrowLeftRight}
            options={kindOptions}
            value={query.kind}
            onChange={(kind) => onChange({ kind })}
            aria-label="Filtrar por tipo"
          />
        ) : null}

        {showCategoryFilter ? (
          <Select
            className={styles.filter}
            icon={Tag}
            options={categoryOptions}
            value={query.categoryId}
            onChange={(categoryId) => onChange({ categoryId })}
            aria-label="Filtrar por categoria"
          />
        ) : null}

        <Select
          className={styles.filter}
          icon={Wallet}
          options={accountOptions}
          value={query.accountId}
          onChange={(accountId) => onChange({ accountId })}
          aria-label="Filtrar por conta ou cartão"
        />

        <Select
          className={styles.filter}
          icon={CircleDot}
          options={statusOptions}
          value={query.status}
          onChange={(status) => onChange({ status })}
          aria-label="Filtrar por situação"
        />
      </div>

      {/* As datas so aparecem quando o usuario pede um periodo proprio. */}
      {showControls && query.period === 'custom' ? (
        <div className={styles.range}>
          <DatePicker
            className={styles.date}
            label="De"
            value={query.from}
            max={query.to || undefined}
            onChange={(from) => onChange({ from })}
          />
          <DatePicker
            className={styles.date}
            label="Até"
            value={query.to}
            min={query.from || undefined}
            onChange={(to) => onChange({ to })}
          />
        </div>
      ) : null}
    </div>
  );
}
