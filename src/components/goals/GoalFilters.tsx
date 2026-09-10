import { ArrowDownUp, CircleDot, Search, X } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { ALL, hasActiveGoalFilters, sortOptions, statusOptions } from './query';
import type { GoalQuery, GoalSort } from './query';
import styles from './GoalFilters.module.css';

interface GoalFiltersProps {
  query: GoalQuery;
  onChange: (patch: Partial<GoalQuery>) => void;
  onClear: () => void;
  resultCount: number;
}

function countLabel(count: number): string {
  if (count === 0) return 'Nenhuma meta encontrada';
  return `${count} ${count === 1 ? 'meta encontrada' : 'metas encontradas'}`;
}

export function GoalFilters({ query, onChange, onClear, resultCount }: GoalFiltersProps) {
  const active = hasActiveGoalFilters(query);

  return (
    <div className={styles.filters}>
      <Input
        className={styles.search}
        icon={Search}
        placeholder="Buscar nas metas"
        value={query.search}
        onChange={(event) => onChange({ search: event.target.value })}
        aria-label="Buscar nas metas"
      />

      <Select
        className={styles.select}
        icon={CircleDot}
        prefix="Situação"
        options={statusOptions}
        value={query.status}
        onChange={(status) => onChange({ status })}
        aria-label="Filtrar por situação"
      />

      <Select
        className={styles.select}
        icon={ArrowDownUp}
        prefix="Ordenar por"
        options={sortOptions}
        value={query.sort}
        onChange={(sort) => onChange({ sort: sort as GoalSort })}
        aria-label="Ordenar as metas"
      />

      {active ? (
        <Button className={styles.clear} variant="ghost" icon={X} onClick={onClear}>
          Limpar
        </Button>
      ) : null}

      <p className={styles.count} role="status" aria-live="polite">
        {query.search.trim() || query.status !== ALL ? countLabel(resultCount) : ''}
      </p>
    </div>
  );
}
