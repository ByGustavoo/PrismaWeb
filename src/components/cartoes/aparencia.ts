import { CreditCard, ShoppingBasket, Utensils, WalletCards } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TomSelo, TomProgresso } from '@/components/ui';
import { PROPORCAO_CRITICA_LIMITE_CARTAO, PROPORCAO_ALERTA_LIMITE_CARTAO } from '@/constants/cartoes';
import type { Situacao, SituacaoFatura, SituacaoParcela, TipoCartao } from '@/types';

export const iconeTipoCartao: Record<TipoCartao, LucideIcon> = {
  CREDITO: CreditCard,
  DEBITO: WalletCards,
  'VALE_ALIMENTACAO': ShoppingBasket,
  'VALE_REFEICAO': Utensils,
};

export const tomSituacaoCartao: Record<Situacao, TomSelo> = {
  ATIVO: 'positive',
  INATIVO: 'neutral',
};

export function tomLimite(ratio: number): TomProgresso {
  if (ratio >= PROPORCAO_CRITICA_LIMITE_CARTAO) return 'negative';
  if (ratio >= PROPORCAO_ALERTA_LIMITE_CARTAO) return 'warning';
  return 'accent';
}

export const tomSituacaoFatura: Record<SituacaoFatura, TomSelo> = {
  FUTURA: 'neutral',
  ABERTA: 'accent',
  FECHADA: 'warning',
  PAGA: 'positive',
  VENCIDA: 'negative',
};

export const tomSituacaoParcela: Record<SituacaoParcela, TomSelo> = {
  PAGA: 'positive',
  ATUAL: 'accent',
  FUTURA: 'neutral',
};
