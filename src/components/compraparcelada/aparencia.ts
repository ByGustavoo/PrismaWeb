import type { TomSelo } from '@/components/ui';
import type { SituacaoParcela } from '@/types';

export const tomSituacaoParcela: Record<SituacaoParcela, TomSelo> = {
  PAGA: 'positive',
  ATUAL: 'accent',
  FUTURA: 'neutral',
};
