import { LOCALE } from '@/constants/app';
import type { CategorySpending, Delta, Transaction, TransactionKind } from '@/types';
import { fromMonthKey } from '@/utils/date';
import { capitalize } from '@/utils/format';

/**
 * Contas que dashboard, previsao e relatorios fazem do mesmo jeito. Ficam num
 * modulo proprio pelo mesmo motivo do saldo: tres telas que somam despesa por
 * categoria com tres implementacoes acabam com tres resultados diferentes.
 */

const monthShort = new Intl.DateTimeFormat(LOCALE, { month: 'short' });

/**
 * "2026-09" -> "Set". Com inicial maiuscula porque e assim que o mes aparece
 * em todo o resto do produto — a faixa do calendario de gastos, logo abaixo do
 * grafico de fluxo, ja escrevia "Set/2026".
 */
export function shortMonthLabel(monthKey: string): string {
  return capitalize(monthShort.format(fromMonthKey(monthKey)).replace('.', ''));
}

export function sumKind(list: Transaction[], kind: TransactionKind): number {
  return list.reduce((total, item) => (item.kind === kind ? total + item.amount : total), 0);
}

/** Variacao percentual entre dois periodos. Sem base de comparacao nao ha variacao. */
export function percentDelta(current: number, previous: number): Delta {
  if (previous === 0) return { percentage: 0, trend: 'flat' };

  const percentage = ((current - previous) / previous) * 100;
  return { percentage, trend: percentage > 0.05 ? 'up' : percentage < -0.05 ? 'down' : 'flat' };
}

/**
 * Agrupa por categoria e ordena do maior para o menor. Serve tanto para despesa
 * quanto para receita: o que muda e a lista que chega, nao a conta.
 */
export function groupByCategory(list: Transaction[], kind: TransactionKind): CategorySpending[] {
  const items = list.filter((item) => item.kind === kind);
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const grouped = new Map<string, CategorySpending>();

  for (const item of items) {
    if (!item.category) continue;
    const existing = grouped.get(item.category.id);
    if (existing) {
      existing.amount += item.amount;
    } else {
      grouped.set(item.category.id, { category: item.category, amount: item.amount, share: 0 });
    }
  }

  return [...grouped.values()]
    .map((entry) => ({ ...entry, share: total > 0 ? entry.amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
}
