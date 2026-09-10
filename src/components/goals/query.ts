import { LOCALE } from '@/constants/app';
import { goalStatusLabel, goalStatuses } from '@/constants/goals';
import type { GoalTracking, Option } from '@/types';
import { fold } from '@/utils/format';

export const ALL = 'all';

export type GoalSort = 'recent' | 'drop' | 'rise' | 'price-desc' | 'price-asc' | 'name';

export interface GoalQuery {
  search: string;
  status: string;
  sort: GoalSort;
}

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
