import type { FaturaDTO, FiltroFaturaDTO, SituacaoFatura } from '@/types';
import { chaveMesPorDeslocamento, deslocarChaveMes, mesesEntre } from '@/utils/data';
import { formatarDataCompleta } from '@/utils/formatacao';

export const rotuloSituacaoFatura: Record<SituacaoFatura, string> = {
  FUTURA: 'Prevista',
  ABERTA: 'Aberta',
  FECHADA: 'Fechada',
  PAGA: 'Paga',
  VENCIDA: 'Vencida',
};

export const ROTULO_FATURA_PAGA_ATE_AGORA = 'Paga até agora';

export function filtroFaturasAtuais(mesAtual: string = chaveMesPorDeslocamento(0)): FiltroFaturaDTO {
  return { dataInicial: deslocarChaveMes(mesAtual, -1), dataFinal: deslocarChaveMes(mesAtual, 1) };
}

export function filtroFaturasDesde(ultimosMeses: number | null, mesAtual: string = chaveMesPorDeslocamento(0)): FiltroFaturaDTO {
  return ultimosMeses === null ? {} : { dataInicial: deslocarChaveMes(mesAtual, 1 - ultimosMeses) };
}

export function dentroDosProximosMeses(mes: string, mesAtual: string, proximosMeses: number | null): boolean {
  return proximosMeses === null || mesesEntre(mesAtual, mes) - 1 <= proximosMeses;
}

export function dentroDosUltimosMeses(mes: string, mesAtual: string, ultimosMeses: number | null): boolean {
  return ultimosMeses === null || mesesEntre(mes, mesAtual) <= ultimosMeses;
}

export function valorEmDestaqueDaFatura(fatura: FaturaDTO | null): number {
  if (!fatura) return 0;
  return fatura.situacao === 'PAGA' ? fatura.total : fatura.valorRestante;
}

export function notaDaFatura(fatura: FaturaDTO | null): string {
  if (!fatura) return 'Sem compras no cartão de crédito';
  const vencimento = formatarDataCompleta(fatura.dataVencimento);
  if (fatura.situacao === 'PAGA') return `${fatura.nomeCartao} — Paga, com vencimento em ${vencimento}`;
  if (fatura.situacao === 'VENCIDA') return `${fatura.nomeCartao} — Venceu em ${vencimento}`;
  return `${fatura.nomeCartao} — Vence em ${vencimento}`;
}
