import type { AmountTone } from '@/components/common';
import type { BadgeTone } from '@/components/ui';
import type { GoalInsight, Tendencia } from '@/types';

export function priceTone(trend: Tendencia): AmountTone {
  if (trend === 'BAIXA') return 'positive';
  if (trend === 'ALTA') return 'negative';
  return 'muted';
}

export const priceTrendLabel: Record<Tendencia, string> = {
  BAIXA: 'Baixou',
  ALTA: 'Subiu',
  ESTAVEL: 'Estável',
};

export const insightTone: Record<GoalInsight, BadgeTone> = {
  PRIMEIRO: 'neutral',
  MENOR: 'positive',
  ABAIXO_DA_MEDIA: 'neutral',
  ACIMA_DA_MEDIA: 'neutral',
  MAIOR: 'warning',
  ESTAVEL: 'neutral',
};
