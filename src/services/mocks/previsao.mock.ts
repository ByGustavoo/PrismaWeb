import { MESES_BASE_PREVISAO, MESES_PREVISAO } from '@/constants/previsao';
import type { LancamentoDTO, MesPrevisaoDTO, PrevisaoDTO } from '@/types';
import { deslocarChaveMes, hojeISO } from '@/utils/data';
import { rotuloMesCurto, somarPorTipo } from './agregacao';
import { saldoEm } from './saldo';
import { totalParcelasEm } from './cartoes.mock';
import { mesAtual, lancamentos } from './dados';
import { totalRecorrentesEm } from './recorrentes.mock';

function dinheiro(value: number): number {
  return Math.round(value * 100) / 100;
}

function doMes(monthKey: string): LancamentoDTO[] {
  return lancamentos.filter((item) => item.data.startsWith(monthKey));
}

function mesesBase(): string[] {
  return Array.from({ length: MESES_BASE_PREVISAO }, (_, index) => deslocarChaveMes(mesAtual, -(index + 1)));
}

function media(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function montarResumoPrevisao(months: number = MESES_PREVISAO): PrevisaoDTO {
  const baseline = mesesBase();

  const averageIncome = dinheiro(media(baseline.map((month) => somarPorTipo(doMes(month), 'RECEITA'))));
  const averageExpense = media(baseline.map((month) => somarPorTipo(doMes(month), 'DESPESA')));
  const averageRecurring = media(baseline.map((month) => totalRecorrentesEm(month)));

  const variable = dinheiro(Math.max(averageExpense - averageRecurring, 0));

  const startingBalance = saldoEm(hojeISO());
  let running = startingBalance;

  const projected: MesPrevisaoDTO[] = Array.from({ length: months }, (_, index) => {
    const month = deslocarChaveMes(mesAtual, index + 1);
    const recurring = totalRecorrentesEm(month);
    const installments = totalParcelasEm(month);
    const expense = dinheiro(recurring + installments + variable);
    const net = dinheiro(averageIncome - expense);

    running = dinheiro(running + net);

    return {
      mes: month,
      rotulo: rotuloMesCurto(month),
      receita: averageIncome,
      recorrentes: recurring,
      parcelas: installments,
      variavel: variable,
      despesa: expense,
      resultado: net,
      saldoFinal: running,
    };
  });

  const lowest = projected.reduce(
    (worst, item) => (item.saldoFinal < worst.saldo ? { mes: item.mes, saldo: item.saldoFinal } : worst),
    { mes: projected[0]?.mes ?? mesAtual, saldo: projected[0]?.saldoFinal ?? startingBalance },
  );

  return {
    saldoInicial: startingBalance,
    meses: projected,
    saldoFinal: projected[projected.length - 1]?.saldoFinal ?? startingBalance,
    resultadoMedio: dinheiro(media(projected.map((item) => item.resultado))),
    menorSaldo: lowest,
  };
}
