import type { TomValorMonetario } from '@/components/comum';
import type { TomSelo } from '@/components/ui';
import type { LeituraMeta, Tendencia } from '@/types';

export function tomPreco(trend: Tendencia): TomValorMonetario {
  if (trend === 'BAIXA') return 'positive';
  if (trend === 'ALTA') return 'negative';
  return 'muted';
}

export const rotuloTendenciaPreco: Record<Tendencia, string> = {
  BAIXA: 'Baixou',
  ALTA: 'Subiu',
  ESTAVEL: 'Estável',
};

export const classeTendenciaPreco: Record<Tendencia, string> = {
  BAIXA: 'down',
  ALTA: 'up',
  ESTAVEL: 'flat',
};

export const tomLeitura: Record<LeituraMeta, TomSelo> = {
  PRIMEIRO: 'neutral',
  MENOR: 'positive',
  ABAIXO_DA_MEDIA: 'neutral',
  ACIMA_DA_MEDIA: 'neutral',
  MAIOR: 'warning',
  ESTAVEL: 'neutral',
};
