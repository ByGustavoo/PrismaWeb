import { DIAS_MAXIMOS_BALDE_DIARIO, DIAS_MAXIMOS_BALDE_SEMANAL } from '@/constants/relatorios';
import type {
  FluxoDTO,
  GastoOrigemDTO,
  LancamentoDTO,
  PatrimonioDTO,
  PeriodoRelatorio,
  RelatorioDTO,
  SaldoDTO,
} from '@/types';
import {
  somarDias,
  diasEntre,
  deDataISO,
  periodoDaChaveMes,
  mesesEntre,
  deslocarChaveMes,
  paraDataISO,
} from '@/utils/data';
import { agruparPorCategoria, variacaoPercentual, rotuloMesCurto, somarPorTipo } from './agregacao';
import { saldoEm, dataFechamentoMes } from './saldo';
import { lancamentos } from './dados';
import { valorCarteiraEm } from './investimentos.mock';

function dinheiro(value: number): number {
  return Math.round(value * 100) / 100;
}

function noPeriodo(range: PeriodoRelatorio): LancamentoDTO[] {
  return lancamentos.filter((item) => item.data >= range.dataInicial && item.data <= range.dataFinal);
}

function periodoAnterior(range: PeriodoRelatorio): PeriodoRelatorio {
  const length = diasEntre(range.dataInicial, range.dataFinal) + 1;
  const end = paraDataISO(somarDias(deDataISO(range.dataInicial), -1));
  return { dataInicial: paraDataISO(somarDias(deDataISO(end), -(length - 1))), dataFinal: end };
}

function rotuloDia(dateISO: string): string {
  return `${dateISO.slice(8, 10)}/${dateISO.slice(5, 7)}`;
}

function baldes(range: PeriodoRelatorio): Array<{ label: string; from: string; to: string }> {
  const days = diasEntre(range.dataInicial, range.dataFinal) + 1;

  if (days <= DIAS_MAXIMOS_BALDE_DIARIO) {
    return Array.from({ length: days }, (_, index) => {
      const date = paraDataISO(somarDias(deDataISO(range.dataInicial), index));
      return { label: rotuloDia(date), from: date, to: date };
    });
  }

  if (days <= DIAS_MAXIMOS_BALDE_SEMANAL) {
    const result: Array<{ label: string; from: string; to: string }> = [];

    for (let cursor = range.dataInicial; cursor <= range.dataFinal; ) {
      const end = paraDataISO(somarDias(deDataISO(cursor), 6));
      const to = end > range.dataFinal ? range.dataFinal : end;
      result.push({ label: rotuloDia(cursor), from: cursor, to });
      cursor = paraDataISO(somarDias(deDataISO(to), 1));
    }

    return result;
  }

  const months = mesesEntre(range.dataInicial.slice(0, 7), range.dataFinal.slice(0, 7));

  return Array.from({ length: months }, (_, index) => {
    const month = deslocarChaveMes(range.dataInicial.slice(0, 7), index);
    const span = periodoDaChaveMes(month);
    return {
      label: rotuloMesCurto(month),
      from: span.from < range.dataInicial ? range.dataInicial : span.from,
      to: span.to > range.dataFinal ? range.dataFinal : span.to,
    };
  });
}

function montarFluxoCaixa(range: PeriodoRelatorio): FluxoDTO[] {
  return baldes(range).map((bucket) => {
    const list = lancamentos.filter((item) => item.data >= bucket.from && item.data <= bucket.to);
    return {
      rotulo: bucket.label,
      receitas: somarPorTipo(list, 'RECEITA'),
      despesas: somarPorTipo(list, 'DESPESA'),
    };
  });
}

function montarHistoricoSaldo(range: PeriodoRelatorio): SaldoDTO[] {
  return baldes(range).map((bucket) => ({ rotulo: bucket.label, saldo: saldoEm(bucket.to) }));
}

function montarPorOrigem(list: LancamentoDTO[]): GastoOrigemDTO[] {
  const expenses = list.filter((item) => item.tipo === 'DESPESA');
  const total = expenses.reduce((sum, item) => sum + item.valor, 0);
  const grouped = new Map<string, GastoOrigemDTO>();

  for (const item of expenses) {
    const existing = grouped.get(item.idOrigem);
    if (existing) {
      existing.valor += item.valor;
      continue;
    }

    grouped.set(item.idOrigem, {
      id: item.idOrigem,
      nome: item.nomeOrigem,
      grupo: item.idOrigem.startsWith('card-') ? 'CARTAO' : 'CONTA',
      valor: item.valor,
      participacao: 0,
    });
  }

  return [...grouped.values()]
    .map((entry) => ({ ...entry, valor: dinheiro(entry.valor), participacao: total > 0 ? entry.valor / total : 0 }))
    .sort((a, b) => b.valor - a.valor);
}

const JANELA_PERIODO_CURTO = 6;

function montarPatrimonio(range: PeriodoRelatorio): PatrimonioDTO[] {
  const last = range.dataFinal.slice(0, 7);
  const span = mesesEntre(range.dataInicial.slice(0, 7), last);
  const length = Math.max(span, JANELA_PERIODO_CURTO);

  return Array.from({ length }, (_, index) => {
    const month = deslocarChaveMes(last, index - (length - 1));
    const accountsValue = saldoEm(dataFechamentoMes(month));
    const investmentsValue = valorCarteiraEm(month);

    return {
      mes: month,
      rotulo: rotuloMesCurto(month),
      contas: accountsValue,
      investimentos: investmentsValue,
      total: dinheiro(accountsValue + investmentsValue),
    };
  });
}

export function montarResumoRelatorio(range: PeriodoRelatorio): RelatorioDTO {
  const current = noPeriodo(range);
  const comparison = noPeriodo(periodoAnterior(range));

  const income = dinheiro(somarPorTipo(current, 'RECEITA'));
  const expense = dinheiro(somarPorTipo(current, 'DESPESA'));

  return {
    dataInicial: range.dataInicial,
    dataFinal: range.dataFinal,
    receitas: income,
    despesas: expense,
    resultado: dinheiro(income - expense),
    variacaoReceitas: variacaoPercentual(income, somarPorTipo(comparison, 'RECEITA')),
    variacaoDespesas: variacaoPercentual(expense, somarPorTipo(comparison, 'DESPESA')),
    quantidadeLancamentos: current.filter((item) => item.tipo !== 'TRANSFERENCIA').length,
    despesasPorCategoria: agruparPorCategoria(current, 'DESPESA'),
    receitasPorCategoria: agruparPorCategoria(current, 'RECEITA'),
    fluxoCaixa: montarFluxoCaixa(range),
    despesasPorOrigem: montarPorOrigem(current),
    historicoSaldo: montarHistoricoSaldo(range),
    patrimonio: montarPatrimonio(range),
  };
}
