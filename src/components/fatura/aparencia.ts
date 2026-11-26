import type { TomSelo } from '@/components/ui';
import { DIAS_HORIZONTE_AVISOS } from '@/constants/aviso/aviso';
import { ROTULO_FATURA_PAGA_ATE_AGORA, rotuloSituacaoFatura } from '@/constants/fatura/fatura';
import type { FaturaCartaoDTO, SituacaoFatura } from '@/types';
import { diasEntre, hojeISO } from '@/utils/data';

const tomSituacaoFatura: Record<SituacaoFatura, TomSelo> = {
  FUTURA: 'neutral',
  ABERTA: 'accent',
  FECHADA: 'warning',
  PAGA: 'positive',
  VENCIDA: 'negative',
};

export function ehVencidaRecente(fatura: FaturaCartaoDTO, hoje: string = hojeISO()): boolean {
  return fatura.situacao === 'VENCIDA' && diasEntre(fatura.dataVencimento, hoje) <= DIAS_HORIZONTE_AVISOS;
}

function ehPagaAteAgora(fatura: FaturaCartaoDTO): boolean {
  const aindaRecebeCompras = fatura.situacao === 'ABERTA' || fatura.situacao === 'FUTURA';
  return aindaRecebeCompras && fatura.valorPago > 0 && fatura.valorRestante <= 0;
}

export function aceitaPagamentoDaFatura(fatura: FaturaCartaoDTO): boolean {
  if (fatura.valorRestante <= 0) return false;
  return fatura.situacao !== 'VENCIDA' || ehVencidaRecente(fatura);
}

export function tomDaFatura(fatura: FaturaCartaoDTO): TomSelo {
  if (ehPagaAteAgora(fatura)) return 'positive';
  if (fatura.situacao === 'VENCIDA' && !ehVencidaRecente(fatura)) return 'neutral';
  return tomSituacaoFatura[fatura.situacao];
}

export function rotuloDaFatura(fatura: FaturaCartaoDTO): string {
  return ehPagaAteAgora(fatura) ? ROTULO_FATURA_PAGA_ATE_AGORA : rotuloSituacaoFatura[fatura.situacao];
}
