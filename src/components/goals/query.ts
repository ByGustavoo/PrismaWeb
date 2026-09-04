import { LOCALE } from '@/constants/app';
import { goalStatusLabel, goalStatuses } from '@/constants/goals';
import type { GoalTracking, Option } from '@/types';
import { fold } from '@/utils/format';

/** Valor usado pelo filtro de situacao para "sem restricao". */
export const ALL = 'all';

export type GoalSort = 'recent' | 'drop' | 'rise' | 'price-desc' | 'price-asc' | 'name';

export interface GoalQuery {
  search: string;
  status: string;
  sort: GoalSort;
}

/**
 * A lista abre pela ultima consulta, e nao por nome: quem entra na tela quer
 * ver o que mudou desde a ultima vez que olhou.
 */
export const emptyGoalQuery: GoalQuery = {
  search: '',
  status: ALL,
  sort: 'recent',
};

export const statusOptions: Option[] = [
  { value: ALL, label: 'Todas as situações' },
  ...goalStatuses.map((status) => ({ value: status, label: goalStatusLabel[status] })),
];

export const sortOptions: Option[] = [
  { value: 'recent', label: 'Atualizadas recentemente' },
  { value: 'drop', label: 'Maior queda' },
  { value: 'rise', label: 'Maior aumento' },
  { value: 'price-desc', label: 'Preço: maior primeiro' },
  { value: 'price-asc', label: 'Preço: menor primeiro' },
  { value: 'name', label: 'Nome (A–Z)' },
];

export function hasActiveGoalFilters(query: GoalQuery): boolean {
  return query.search.trim() !== '' || query.status !== ALL || query.sort !== emptyGoalQuery.sort;
}

function compare(a: GoalTracking, b: GoalTracking, sort: GoalSort): number {
  switch (sort) {
    case 'drop':
      return a.analysis.changePercentage - b.analysis.changePercentage;
    case 'rise':
      return b.analysis.changePercentage - a.analysis.changePercentage;
    case 'price-desc':
      return b.analysis.currentPrice - a.analysis.currentPrice;
    case 'price-asc':
      return a.analysis.currentPrice - b.analysis.currentPrice;
    case 'name':
      return a.goal.name.localeCompare(b.goal.name, LOCALE);
    default:
      return b.analysis.lastUpdate.localeCompare(a.analysis.lastUpdate);
  }
}

/**
 * Busca, filtro e ordenacao acontecem em memoria, como em Lancamentos: com
 * poucas dezenas de metas, responder a cada tecla vale mais que uma ida ao
 * servidor por letra digitada. Os mesmos parametros existem no service porque
 * sao os que a API vai receber quando a lista crescer.
 */
export function applyGoalQuery(items: GoalTracking[], query: GoalQuery): GoalTracking[] {
  const needle = fold(query.search.trim());

  return items
    .filter((item) => {
      if (query.status !== ALL && item.goal.status !== query.status) return false;
      if (!needle) return true;
      return fold(item.goal.name).includes(needle) || fold(item.goal.notes ?? '').includes(needle);
    })
    .sort((a, b) => compare(a, b, query.sort));
}
