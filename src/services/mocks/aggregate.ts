import { LOCALE } from '@/constants/app';
import type { GastoPorCategoria, Variacao, Lancamento, TipoLancamento } from '@/types';
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

export function sumKind(list: Lancamento[], kind: TipoLancamento): number {
  return list.reduce((total, item) => (item.tipo === kind ? total + item.valor : total), 0);
}

/** Variacao percentual entre dois periodos. Sem base de comparacao nao ha variacao. */
export function percentDelta(current: number, previous: number): Variacao {
  if (previous === 0) return { percentual: 0, tendencia: 'ESTAVEL' };

  const percentual = ((current - previous) / previous) * 100;
  return { percentual, tendencia: percentual > 0.05 ? 'ALTA' : percentual < -0.05 ? 'BAIXA' : 'ESTAVEL' };
}

/**
 * Agrupa por categoria e ordena do maior para o menor. Serve tanto para despesa
 * quanto para receita: o que muda e a lista que chega, nao a conta.
 */
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
