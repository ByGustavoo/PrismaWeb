import type { FiltroFaturaDTO, SituacaoFatura } from '@/types';
import { chaveMesPorDeslocamento, deslocarChaveMes } from '@/utils/data';

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

export function filtroFaturasDesde(mesesAnteriores: number | null, mesAtual: string = chaveMesPorDeslocamento(0)): FiltroFaturaDTO {
  return mesesAnteriores === null ? {} : { dataInicial: deslocarChaveMes(mesAtual, -mesesAnteriores) };
}
