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

/**
 * Proxima ocorrencia depois de `dateISO`. As recorrencias em meses preservam o
 * dia do mes e caem no ultimo dia quando ele nao existe — dia 31 em fevereiro
 * vira 28, como fazem os debitos automaticos. As em dias so somam dias.
 */
export function nextOccurrence(dateISO: string, frequency: RecurrenceFrequency): string {
  const days = recurrenceStepDays[frequency];
  if (days > 0) return toISODate(addDays(fromISODate(dateISO), days));

  const date = fromISODate(dateISO);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + recurrenceStepMonths[frequency], 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

  return toISODate(new Date(target.getFullYear(), target.getMonth(), Math.min(day, lastDay)));
}

/**
 * Datas em que a recorrencia cai dentro do mes. Uma semanal aparece quatro ou
 * cinco vezes; uma anual, em um mes por ano e em nenhum outro. E o que faz a
 * previsao somar o seguro do carro so no mes em que ele vence, em vez de diluir
 * um doze avos por todos os meses da projecao.
 */
export function occurrencesIn(item: RecurringExpense, monthKey: string): string[] {
  const { from, to } = monthKeyRange(monthKey);
  const dates: string[] = [];

  let cursor = item.nextDueDate;

  // Recorrencia cadastrada com vencimento a frente do mes pedido nao acontece
  // nele; a que ficou para tras avanca ate alcancar a janela.
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

/** Quanto as recorrentes ativas somam no mes indicado. */
export function recurringTotalIn(monthKey: string): number {
  return money(
    recurringExpenses
      .filter((item) => item.status === 'active')
      .reduce((total, item) => total + item.amount * occurrencesIn(item, monthKey).length, 0),
  );
}

/** Custo mensal equivalente das ativas, com cada recorrencia normalizada. */
export function recurringMonthlyCost(): number {
  return money(
    recurringExpenses
      .filter((item) => item.status === 'active')
      .reduce((total, item) => total + item.amount * monthlyOccurrences[item.frequency], 0),
  );
}

export function buildRecurringSummary(): RecurringSummary {
  const today = todayISO();

  // Ativas primeiro e, entre elas, a que vence antes: a lista abre no que
  // precisa de dinheiro em caixa nos proximos dias.
  const items = [...recurringExpenses].sort((a, b) => {
    const paused = Number(a.status === 'paused') - Number(b.status === 'paused');
    if (paused !== 0) return paused;
    return a.nextDueDate.localeCompare(b.nextDueDate);
  });

  const monthlyCost = recurringMonthlyCost();

  const dueSoon = items.filter((item) => {
    if (item.status !== 'active') return false;
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
