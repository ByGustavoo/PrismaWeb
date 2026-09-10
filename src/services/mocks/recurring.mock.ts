import {
  RECURRING_DUE_SOON_DAYS,
  monthlyOccurrences,
  recurrenceStepDays,
  recurrenceStepMonths,
} from '@/constants/recurring';
import type { RecurrenceFrequency, RecurringExpense, RecurringSummary } from '@/types';
import { addDays, daysBetween, fromISODate, monthKeyRange, toISODate, todayISO } from '@/utils/date';
import { recurringExpenses } from './data';

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export function nextOccurrence(dateISO: string, frequency: RecurrenceFrequency): string {
  const days = recurrenceStepDays[frequency];
  if (days > 0) return toISODate(addDays(fromISODate(dateISO), days));

  const date = fromISODate(dateISO);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + recurrenceStepMonths[frequency], 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

  return toISODate(new Date(target.getFullYear(), target.getMonth(), Math.min(day, lastDay)));
}

export function occurrencesIn(item: RecurringExpense, monthKey: string): string[] {
  const { from, to } = monthKeyRange(monthKey);
  const dates: string[] = [];

  let cursor = item.nextDueDate;

  let guard = 0;
  while (cursor < from && guard < 400) {
    cursor = nextOccurrence(cursor, item.frequency);
    guard += 1;
  }

  while (cursor <= to && guard < 400) {
    dates.push(cursor);
    cursor = nextOccurrence(cursor, item.frequency);
    guard += 1;
  }

  return dates;
}

export function recurringTotalIn(monthKey: string): number {
  return money(
    recurringExpenses
      .filter((item) => item.status === 'ATIVO')
      .reduce((total, item) => total + item.amount * occurrencesIn(item, monthKey).length, 0),
  );
}

export function recurringMonthlyCost(): number {
  return money(
    recurringExpenses
      .filter((item) => item.status === 'ATIVO')
      .reduce((total, item) => total + item.amount * monthlyOccurrences[item.frequency], 0),
  );
}

export function buildRecurringSummary(): RecurringSummary {
  const today = todayISO();

  const items = [...recurringExpenses].sort((a, b) => {
    const paused = Number(a.status === 'PAUSADO') - Number(b.status === 'PAUSADO');
    if (paused !== 0) return paused;
    return a.nextDueDate.localeCompare(b.nextDueDate);
  });

  const monthlyCost = recurringMonthlyCost();

  const dueSoon = items.filter((item) => {
    if (item.status !== 'ATIVO') return false;
    const days = daysBetween(today, item.nextDueDate);
    return days >= 0 && days <= RECURRING_DUE_SOON_DAYS;
  });

  return {
    items,
    monthlyCost,
    yearlyCost: money(monthlyCost * 12),
    dueSoon,
  };
}
