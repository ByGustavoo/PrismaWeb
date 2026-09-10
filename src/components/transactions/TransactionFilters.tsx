import { useId, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarRange, CircleDot, Search, SlidersHorizontal, Tag, Wallet, X } from 'lucide-react';
import { HeaderSlot } from '@/components/layout';
import { Button, DatePicker, Input, Select } from '@/components/ui';
import { LOCALE } from '@/constants/app';
import { transactionKindPluralLabel, transactionStatusLabel } from '@/constants/transactions';
import { useIsCompact } from '@/hooks/useMediaQuery';
import type { Option, Lancamento } from '@/types';
import { cn } from '@/utils/cn';
import { ALL, hasActiveFilters, periodOptions } from './query';
import type { TransactionQuery } from './query';
import styles from './TransactionFilters.module.css';

interface TransactionFiltersProps {
  query: TransactionQuery;
  onChange: (patch: Partial<TransactionQuery>) => void;
  onClear: () => void;
  source: Lancamento[];
  showKindFilter: boolean;
  showCategoryFilter: boolean;
}

const kindOptions: Option[] = [
  { value: ALL, label: 'Todos os tipos' },
  { value: 'RECEITA', label: transactionKindPluralLabel.RECEITA },
  { value: 'DESPESA', label: transactionKindPluralLabel.DESPESA },
  { value: 'TRANSFERENCIA', label: transactionKindPluralLabel.TRANSFERENCIA },
];

const statusOptions: Option[] = [
  { value: ALL, label: 'Todas as situações' },
  { value: 'PAGO', label: transactionStatusLabel.PAGO },
  { value: 'PENDENTE', label: transactionStatusLabel.PENDENTE },
  { value: 'AGENDADO', label: transactionStatusLabel.AGENDADO },
];

function countActiveFilters(query: TransactionQuery): number {
  return [query.period, query.kind, query.categoryId, query.accountId, query.status].filter(
    (value) => value !== ALL,
  ).length;
}

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
        source.flatMap((item) => (item.categoria ? [[item.categoria.id, item.categoria.nome] as [string, string]] : [])),
        'Todas as categorias',
      ),
    [source],
  );

  const accountOptions = useMemo(
    () =>
      toOptions(
        source.flatMap((item) => {
          const entries: Array<[string, string]> = [[item.idOrigem, item.nomeOrigem]];
          if (item.idContaDestino && item.nomeContaDestino) entries.push([item.idContaDestino, item.nomeContaDestino]);
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

  return (
    <div className={styles.filters}>
      {isCompact ? (
        <div className={styles.searchRow}>
          {search}

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
