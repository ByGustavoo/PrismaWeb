import { GOAL_EXTREME_TOLERANCE, GOAL_STABLE_THRESHOLD } from '@/constants/goals';
import type {
  Goal,
  GoalAnalysis,
  GoalInsight,
  GoalPriceEntry,
  GoalStatus,
  GoalTracking,
  GoalsSummary,
  Tendencia,
} from '@/types';
import { fold } from '@/utils/format';
import { goals } from './data';

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function ordered(goal: Goal): GoalPriceEntry[] {
  return [...goal.history].sort((a, b) => a.date.localeCompare(b.date));
}

function insightOf(
  current: number,
  lowest: number,
  highest: number,
  average: number,
  entryCount: number,
): GoalInsight {
  if (entryCount < 2) return 'PRIMEIRO';

  const span = highest - lowest;
  if (span < 0.01) return 'ESTAVEL';

  const position = (current - lowest) / span;
  if (position <= GOAL_EXTREME_TOLERANCE) return 'MENOR';
  if (position >= 1 - GOAL_EXTREME_TOLERANCE) return 'MAIOR';

  return current < average ? 'ABAIXO_DA_MEDIA' : 'ACIMA_DA_MEDIA';
}

function trendOf(change: number, initial: number): Tendencia {
  if (initial <= 0) return 'ESTAVEL';
  if (Math.abs(change / initial) <= GOAL_STABLE_THRESHOLD) return 'ESTAVEL';
  return change > 0 ? 'ALTA' : 'BAIXA';
}

export function analyzeGoal(goal: Goal): GoalAnalysis {
  const history = ordered(goal);
  const first = history[0];
  const last = history[history.length - 1];

  if (!first || !last) {
    return {
      initialPrice: 0,
      currentPrice: 0,
      lowestPrice: 0,
      highestPrice: 0,
      averagePrice: 0,
      change: 0,
      changePercentage: 0,
      trend: 'ESTAVEL',
      savings: 0,
      lastUpdate: goal.createdAt,
      entryCount: 0,
      insight: 'ESTAVEL',
    };
  }

  const prices = history.map((entry) => entry.price);
  const initialPrice = first.price;
  const currentPrice = last.price;
  const lowestPrice = money(Math.min(...prices));
  const highestPrice = money(Math.max(...prices));
  const averagePrice = money(prices.reduce((total, price) => total + price, 0) / prices.length);
  const change = money(currentPrice - initialPrice);

  return {
    initialPrice,
    currentPrice,
    lowestPrice,
    highestPrice,
    averagePrice,
    change,
    changePercentage: initialPrice > 0 ? (change / initialPrice) * 100 : 0,
    trend: trendOf(change, initialPrice),
    savings: money(Math.max(highestPrice - currentPrice, 0)),
    lastUpdate: last.date,
    entryCount: history.length,
    insight: insightOf(currentPrice, lowestPrice, highestPrice, averagePrice, history.length),
  };
}

export function buildGoalTracking(goal: Goal): GoalTracking {
  return { goal: { ...goal, history: ordered(goal) }, analysis: analyzeGoal(goal) };
}

export interface GoalFilters {
  status?: GoalStatus;
  search?: string;
}

function matches(goal: Goal, filters: GoalFilters): boolean {
  if (filters.status && goal.status !== filters.status) return false;

  const term = filters.search?.trim();
  if (!term) return true;

  const needle = fold(term);
  return fold(goal.name).includes(needle) || fold(goal.notes ?? '').includes(needle);
}

export function buildGoalsSummary(filters: GoalFilters = {}): GoalsSummary {
  const items = goals
    .filter((goal) => matches(goal, filters))
    .map(buildGoalTracking)
    .sort((a, b) => b.analysis.lastUpdate.localeCompare(a.analysis.lastUpdate));

  const tracking = items.filter((item) => item.goal.status === 'ACOMPANHANDO');
  const currentTotal = money(tracking.reduce((total, item) => total + item.analysis.currentPrice, 0));
  const initialTotal = money(tracking.reduce((total, item) => total + item.analysis.initialPrice, 0));

  return {
    items,
    trackingCount: tracking.length,
    purchasedCount: items.filter((item) => item.goal.status === 'COMPRADA').length,
    currentTotal,
    initialTotal,
    totalChange: money(currentTotal - initialTotal),
    totalSavings: money(tracking.reduce((total, item) => total + item.analysis.savings, 0)),
  };
}
