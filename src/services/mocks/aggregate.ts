import { LOCALE } from '@/constants/app';
import type { GastoPorCategoria, Variacao, Lancamento, TipoLancamento } from '@/types';
import { fromMonthKey } from '@/utils/date';
import { capitalize } from '@/utils/format';

const monthShort = new Intl.DateTimeFormat(LOCALE, { month: 'short' });

export function shortMonthLabel(monthKey: string): string {
  return capitalize(monthShort.format(fromMonthKey(monthKey)).replace('.', ''));
}

export function sumKind(list: Lancamento[], kind: TipoLancamento): number {
  return list.reduce((total, item) => (item.tipo === kind ? total + item.valor : total), 0);
}

export function percentDelta(current: number, previous: number): Variacao {
  if (previous === 0) return { percentual: 0, tendencia: 'ESTAVEL' };

  const percentual = ((current - previous) / previous) * 100;
  return { percentual, tendencia: percentual > 0.05 ? 'ALTA' : percentual < -0.05 ? 'BAIXA' : 'ESTAVEL' };
}

export function groupByCategory(list: Lancamento[], kind: TipoLancamento): GastoPorCategoria[] {
  const items = list.filter((item) => item.tipo === kind);
  const total = items.reduce((sum, item) => sum + item.valor, 0);
  const grouped = new Map<string, GastoPorCategoria>();

  for (const item of items) {
    if (!item.categoria) continue;
    const existing = grouped.get(item.categoria.id);
    if (existing) {
      existing.valor += item.valor;
    } else {
      grouped.set(item.categoria.id, { categoria: item.categoria, valor: item.valor, participacao: 0 });
    }
  }

  return [...grouped.values()]
    .map((entry) => ({ ...entry, participacao: total > 0 ? entry.valor / total : 0 }))
    .sort((a, b) => b.valor - a.valor);
}
