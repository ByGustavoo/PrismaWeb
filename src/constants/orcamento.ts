import type { TomSelo, TomProgresso } from '@/components/ui';
import type { SituacaoOrcamento } from '@/types';

export const PROPORCAO_ALERTA_ORCAMENTO = 0.8;
export const PROPORCAO_ESTOURO_ORCAMENTO = 1;

export const DIAS_MINIMOS_PROJECAO_ORCAMENTO = 10;

export function situacaoOrcamentoDe(ratio: number): SituacaoOrcamento {
  if (ratio >= PROPORCAO_ESTOURO_ORCAMENTO) return 'ESTOURADO';
  if (ratio >= PROPORCAO_ALERTA_ORCAMENTO) return 'ALERTA';
  return 'SEGURO';
}

export const rotuloSituacaoOrcamento: Record<SituacaoOrcamento, string> = {
  SEGURO: 'Dentro do limite',
  ALERTA: 'Perto do limite',
  ESTOURADO: 'Limite estourado',
};

export const tomSituacaoOrcamento: Record<SituacaoOrcamento, TomSelo> = {
  SEGURO: 'positive',
  ALERTA: 'warning',
  ESTOURADO: 'negative',
};

export const tomProgressoOrcamento: Record<SituacaoOrcamento, TomProgresso> = {
  SEGURO: 'accent',
  ALERTA: 'warning',
  ESTOURADO: 'negative',
};
