import {
  DIAS_VENCIMENTO_PROXIMO,
  ocorrenciasMensais,
  passoFrequenciaDias,
  passoFrequenciaMeses,
} from '@/constants/recorrentes';
import type { DespesaRecorrenteDTO, Frequencia, ResumoDespesasRecorrentesDTO } from '@/types';
import { somarDias, diasEntre, deDataISO, periodoDaChaveMes, paraDataISO, hojeISO } from '@/utils/data';
import { despesasRecorrentes } from './dados';

function dinheiro(value: number): number {
  return Math.round(value * 100) / 100;
}

export function proximaOcorrencia(dateISO: string, frequency: Frequencia): string {
  const days = passoFrequenciaDias[frequency];
  if (days > 0) return paraDataISO(somarDias(deDataISO(dateISO), days));

  const date = deDataISO(dateISO);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + passoFrequenciaMeses[frequency], 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

  return paraDataISO(new Date(target.getFullYear(), target.getMonth(), Math.min(day, lastDay)));
}

export function ocorrenciasEm(item: DespesaRecorrenteDTO, monthKey: string): string[] {
  const { from, to } = periodoDaChaveMes(monthKey);
  const dates: string[] = [];

  let cursor = item.proximoVencimento;

  let guard = 0;
  while (cursor < from && guard < 400) {
    cursor = proximaOcorrencia(cursor, item.frequencia);
    guard += 1;
  }

  while (cursor <= to && guard < 400) {
    dates.push(cursor);
    cursor = proximaOcorrencia(cursor, item.frequencia);
    guard += 1;
  }

  return dates;
}

export function totalRecorrentesEm(monthKey: string): number {
  return dinheiro(
    despesasRecorrentes
      .filter((item) => item.situacao === 'ATIVO')
      .reduce((total, item) => total + item.valor * ocorrenciasEm(item, monthKey).length, 0),
  );
}

export function custoMensalRecorrentes(): number {
  return dinheiro(
    despesasRecorrentes
      .filter((item) => item.situacao === 'ATIVO')
      .reduce((total, item) => total + item.valor * ocorrenciasMensais[item.frequencia], 0),
  );
}

export function montarResumoRecorrentes(): ResumoDespesasRecorrentesDTO {
  const today = hojeISO();

  const items = [...despesasRecorrentes].sort((a, b) => {
    const paused = Number(a.situacao === 'PAUSADO') - Number(b.situacao === 'PAUSADO');
    if (paused !== 0) return paused;
    return a.proximoVencimento.localeCompare(b.proximoVencimento);
  });

  const monthlyCost = custoMensalRecorrentes();

  const dueSoon = items.filter((item) => {
    if (item.situacao !== 'ATIVO') return false;
    const days = diasEntre(today, item.proximoVencimento);
    return days >= 0 && days <= DIAS_VENCIMENTO_PROXIMO;
  });

  return {
    itens: items,
    custoMensal: monthlyCost,
    custoAnual: dinheiro(monthlyCost * 12),
    vencendoEmBreve: dueSoon,
  };
}
