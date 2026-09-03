import { useMemo } from 'react';
import { ArrowLeftRight, CalendarRange, CircleDot, Search, Tag, Wallet, X } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { LOCALE } from '@/constants/app';
import { transactionKindPluralLabel, transactionStatusLabel } from '@/constants/transactions';
import type { Option, Transaction } from '@/types';
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

  return (
    <div className={styles.filters}>
      <div className={styles.controls}>
        <Input
          className={styles.search}
          icon={Search}
          placeholder="Buscar por descrição, categoria ou conta"
          value={query.search}
          onChange={(event) => onChange({ search: event.target.value })}
          aria-label="Buscar lançamentos"
        />

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

        {hasActiveFilters(query) ? (
          <Button className={styles.clear} variant="ghost" size="sm" icon={X} onClick={onClear}>
            Limpar
          </Button>
        ) : null}
      </div>

      {/* As datas so aparecem quando o usuario pede um periodo proprio. */}
      {query.period === 'custom' ? (
        <div className={styles.range}>
          <Input
            className={styles.date}
            type="date"
            label="De"
            value={query.from}
            max={query.to || undefined}
            onChange={(event) => onChange({ from: event.target.value })}
          />
          <Input
            className={styles.date}
            type="date"
            label="Até"
            value={query.to}
            min={query.from || undefined}
            onChange={(event) => onChange({ to: event.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
