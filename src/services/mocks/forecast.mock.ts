import { FORECAST_BASELINE_MONTHS, FORECAST_MONTHS } from '@/constants/forecast';
import type { ForecastMonth, ForecastSummary, Lancamento } from '@/types';
import { shiftMonthKey, todayISO } from '@/utils/date';
import { shortMonthLabel, sumKind } from './aggregate';
import { balanceAt } from './balance';
import { installmentTotalIn } from './cards.mock';
import { currentMonth, transactions } from './data';
import { recurringTotalIn } from './recurring.mock';

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function ofMonth(monthKey: string): Lancamento[] {
  return transactions.filter((item) => item.data.startsWith(monthKey));
}

function baselineMonths(): string[] {
  return Array.from({ length: FORECAST_BASELINE_MONTHS }, (_, index) => shiftMonthKey(currentMonth, -(index + 1)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function buildForecastSummary(months: number = FORECAST_MONTHS): ForecastSummary {
  const baseline = baselineMonths();

  const averageIncome = money(average(baseline.map((month) => sumKind(ofMonth(month), 'RECEITA'))));
  const averageExpense = average(baseline.map((month) => sumKind(ofMonth(month), 'DESPESA')));
  const averageInstallments = average(baseline.map((month) => installmentTotalIn(month)));
  const averageRecurring = average(baseline.map((month) => recurringTotalIn(month)));

  const variable = money(Math.max(averageExpense - averageRecurring - averageInstallments, 0));

  const startingBalance = balanceAt(todayISO());
  let running = startingBalance;

  const projected: ForecastMonth[] = Array.from({ length: months }, (_, index) => {
    const month = shiftMonthKey(currentMonth, index + 1);
    const recurring = recurringTotalIn(month);
    const installments = installmentTotalIn(month);
    const expense = money(recurring + installments + variable);
    const net = money(averageIncome - expense);

    running = money(running + net);

    return {
      month,
      label: shortMonthLabel(month),
      income: averageIncome,
      recurring,
      installments,
      variable,
      expense,
      net,
      endingBalance: running,
    };
  });

  const lowest = projected.reduce(
    (worst, item) => (item.endingBalance < worst.balance ? { month: item.month, balance: item.endingBalance } : worst),
    { month: projected[0]?.month ?? currentMonth, balance: projected[0]?.endingBalance ?? startingBalance },
  );

  return {
    startingBalance,
    months: projected,
    endingBalance: projected[projected.length - 1]?.endingBalance ?? startingBalance,
    averageNet: money(average(projected.map((item) => item.net))),
    lowest,
  };
}
