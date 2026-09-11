import { LOCALIDADE } from '@/constants/aplicacao';
import type {
  DashboardDTO,
  FluxoDTO,
  GastoDiarioDTO,
  LancamentoDTO,
  SaldoDTO,
} from '@/types';
import {
  somarDias,
  deDataISO,
  deChaveMes,
  periodoDaChaveMes,
  mesesEntre,
  deslocarChaveMes,
  paraDataISO,
} from '@/utils/data';
import { agruparPorCategoria, variacaoPercentual, rotuloMesCurto, somarPorTipo } from './agregacao';
import { saldoEm, dataFechamentoMes } from './saldo';
import { montarFaturas } from './cartoes.mock';
import { mesAtual, investimentos, lancamentos } from './dados';

export interface PeriodoDashboard {
  dataInicial: string;
  dataFinal: string;
}

const JANELA_MES_UNICO = 6;

function janelaDeMeses(monthKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => deslocarChaveMes(monthKey, index - (count - 1)));
}

function janelaDosGraficos(period: PeriodoDashboard): string[] {
  const length = mesesEntre(period.dataInicial, period.dataFinal);
  return janelaDeMeses(period.dataFinal, length > 1 ? length : JANELA_MES_UNICO);
}

function noPeriodo(period: PeriodoDashboard): LancamentoDTO[] {
  const month = (item: LancamentoDTO) => item.data.slice(0, 7);
  return lancamentos.filter((item) => month(item) >= period.dataInicial && month(item) <= period.dataFinal);
}

function doMes(monthKey: string): LancamentoDTO[] {
  return lancamentos.filter((item) => item.data.startsWith(monthKey));
}

function periodoAnterior(period: PeriodoDashboard): PeriodoDashboard {
  const length = mesesEntre(period.dataInicial, period.dataFinal);
  return { dataInicial: deslocarChaveMes(period.dataInicial, -length), dataFinal: deslocarChaveMes(period.dataFinal, -length) };
}

function montarGastoDiario(window: string[]): GastoDiarioDTO[] {
  const first = window[0];
  const last = window[window.length - 1];
  if (!first || !last) return [];

  const totals = new Map<string, number>();

  for (const item of lancamentos) {
    if (item.tipo !== 'DESPESA') continue;
    const month = item.data.slice(0, 7);
    if (month < first || month > last) continue;
    totals.set(item.data, (totals.get(item.data) ?? 0) + item.valor);
  }

  const days: GastoDiarioDTO[] = [];
  const end = deDataISO(periodoDaChaveMes(last).to);

  for (let cursor = deChaveMes(first); cursor <= end; cursor = somarDias(cursor, 1)) {
    const date = paraDataISO(cursor);
    days.push({ data: date, valor: totals.get(date) ?? 0 });
  }

  return days;
}

function montarFluxoCaixa(window: string[]): FluxoDTO[] {
  return window.map((key) => {
    const list = doMes(key);
    return {
      rotulo: rotuloMesCurto(key),
      receitas: somarPorTipo(list, 'RECEITA'),
      despesas: somarPorTipo(list, 'DESPESA'),
    };
  });
}

function montarHistoricoSaldo(window: string[]): SaldoDTO[] {
  return window.map((key) => ({ rotulo: rotuloMesCurto(key), saldo: saldoEm(dataFechamentoMes(key)) }));
}

function montarFatura(monthKey: string): DashboardDTO['faturaAtual'] {
  const monthly = montarFaturas().filter((invoice) => invoice.mes === monthKey);
  const open = monthly.filter((invoice) => invoice.situacao === 'ABERTA');
  const chosen = [...(open.length > 0 ? open : monthly)].sort((a, b) => b.total - a.total)[0];

  if (!chosen) return null;

  return {
    total: chosen.total,
    nomeCartao: chosen.nomeCartao,
    dataVencimento: chosen.dataVencimento,
    situacao: chosen.situacao,
  };
}

export function montarResumoDashboard(
  period: PeriodoDashboard = { dataInicial: mesAtual, dataFinal: mesAtual },
): DashboardDTO {
  const previous = periodoAnterior(period);
  const current = noPeriodo(period);
  const comparison = noPeriodo(previous);

  const monthIncome = somarPorTipo(current, 'RECEITA');
  const monthExpense = somarPorTipo(current, 'DESPESA');
  const currentBalance = saldoEm(dataFechamentoMes(period.dataFinal));

  const investmentsTotal = investimentos.reduce((total, item) => total + item.valorAtual, 0);
  const investedTotal = investimentos.reduce((total, item) => total + item.aportado, 0);

  const recentTransactions = [...current]
    .sort((a, b) => b.data.localeCompare(a.data) || a.descricao.localeCompare(b.descricao, LOCALIDADE))
    .slice(0, 6);

  const window = janelaDosGraficos(period);

  return {
    dataInicial: period.dataInicial,
    dataFinal: period.dataFinal,
    saldoAtual: currentBalance,
    variacaoSaldo: variacaoPercentual(currentBalance, saldoEm(dataFechamentoMes(previous.dataFinal))),
    receitasMes: monthIncome,
    variacaoReceitas: variacaoPercentual(monthIncome, somarPorTipo(comparison, 'RECEITA')),
    despesasMes: monthExpense,
    variacaoDespesas: variacaoPercentual(monthExpense, somarPorTipo(comparison, 'DESPESA')),
    totalInvestido: investmentsTotal,
    variacaoInvestimentos: variacaoPercentual(investmentsTotal, investedTotal),
    faturaAtual: montarFatura(period.dataFinal),
    historicoSaldo: montarHistoricoSaldo(window),
    fluxoCaixa: montarFluxoCaixa(window),
    gastoDiario: montarGastoDiario(window),
    gastoPorCategoria: agruparPorCategoria(current, 'DESPESA'),
    lancamentosRecentes: recentTransactions,
  };
}
