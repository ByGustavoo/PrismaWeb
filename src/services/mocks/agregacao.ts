import { LOCALIDADE } from '@/constants/aplicacao';
import type { GastoCategoriaDTO, LancamentoDTO, TipoLancamento, VariacaoDTO } from '@/types';
import { deChaveMes } from '@/utils/data';
import { capitalizar } from '@/utils/formatacao';

const mesAbreviado = new Intl.DateTimeFormat(LOCALIDADE, { month: 'short' });

export function rotuloMesCurto(monthKey: string): string {
  return capitalizar(mesAbreviado.format(deChaveMes(monthKey)).replace('.', ''));
}

export function somarPorTipo(list: LancamentoDTO[], kind: TipoLancamento): number {
  return list.reduce((total, item) => (item.tipo === kind ? total + item.valor : total), 0);
}

export function variacaoPercentual(current: number, previous: number): VariacaoDTO {
  if (previous === 0) return { percentual: 0, tendencia: 'ESTAVEL' };

  const percentual = ((current - previous) / previous) * 100;
  return { percentual, tendencia: percentual > 0.05 ? 'ALTA' : percentual < -0.05 ? 'BAIXA' : 'ESTAVEL' };
}

export function agruparPorCategoria(list: LancamentoDTO[], kind: TipoLancamento): GastoCategoriaDTO[] {
  const items = list.filter((item) => item.tipo === kind);
  const total = items.reduce((sum, item) => sum + item.valor, 0);
  const grouped = new Map<string, GastoCategoriaDTO>();

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
