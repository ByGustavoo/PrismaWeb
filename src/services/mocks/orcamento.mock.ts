import { DIAS_MINIMOS_PROJECAO_ORCAMENTO, situacaoOrcamentoDe } from '@/constants/orcamento';
import type { ConsumoOrcamentoDTO, GastoCategoriaDTO, LancamentoDTO, VisaoGeralOrcamentoDTO } from '@/types';
import { deChaveMes, hojeISO } from '@/utils/data';
import { agruparPorCategoria } from './agregacao';
import { orcamentos, mesAtual, lancamentos } from './dados';

function dinheiro(value: number): number {
  return Math.round(value * 100) / 100;
}

function despesasDoMes(monthKey: string): LancamentoDTO[] {
  return lancamentos.filter((item) => item.tipo === 'DESPESA' && item.data.startsWith(monthKey));
}

function diasDecorridos(monthKey: string, daysInMonth: number): number {
  const today = hojeISO();
  const thisMonth = today.slice(0, 7);

  if (monthKey < thisMonth) return daysInMonth;
  if (monthKey > thisMonth) return 0;
  return Number(today.slice(8, 10));
}

export function montarVisaoGeralOrcamento(month: string = mesAtual): VisaoGeralOrcamentoDTO {
  const expenses = despesasDoMes(month);
  const start = deChaveMes(month);
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const daysElapsed = diasDecorridos(month, daysInMonth);
  const projects = daysElapsed >= DIAS_MINIMOS_PROJECAO_ORCAMENTO && daysElapsed < daysInMonth;

  const spentByCategory = new Map<string, number>();
  for (const item of expenses) {
    if (!item.categoria) continue;
    spentByCategory.set(item.categoria.id, (spentByCategory.get(item.categoria.id) ?? 0) + item.valor);
  }

  const items: ConsumoOrcamentoDTO[] = orcamentos
    .map((budget) => {
      const spent = dinheiro(spentByCategory.get(budget.categoria.id) ?? 0);
      const ratio = budget.limiteMensal > 0 ? spent / budget.limiteMensal : 0;

      return {
        orcamento: budget,
        gasto: spent,
        restante: dinheiro(budget.limiteMensal - spent),
        consumo: ratio,
        projecao: projects ? dinheiro((spent / daysElapsed) * daysInMonth) : spent,
        situacao: situacaoOrcamentoDe(ratio),
      };
    })
    .sort((a, b) => b.consumo - a.consumo);

  const planned = dinheiro(orcamentos.reduce((total, item) => total + item.limiteMensal, 0));
  const spent = dinheiro(items.reduce((total, item) => total + item.gasto, 0));

  const budgetedIds = new Set(orcamentos.map((item) => item.categoria.id));
  const unplanned: GastoCategoriaDTO[] = agruparPorCategoria(expenses, 'DESPESA').filter(
    (entry) => !budgetedIds.has(entry.categoria.id),
  );

  return {
    mes: month,
    planejado: planned,
    gasto: spent,
    restante: dinheiro(planned - spent),
    consumo: planned > 0 ? spent / planned : 0,
    diasRestantes: Math.max(daysInMonth - daysElapsed, 0),
    diasDecorridos: daysElapsed,
    diasNoMes: daysInMonth,
    itens: items,
    foraDoOrcamento: unplanned,
  };
}
