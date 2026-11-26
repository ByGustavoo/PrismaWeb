import { CreditCard, ShoppingBasket, Utensils, WalletCards } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TomSelo, TomProgresso } from '@/components/ui';
import { PROPORCAO_CRITICA_LIMITE_CARTAO, PROPORCAO_ALERTA_LIMITE_CARTAO } from '@/constants/cartao/cartao';
import type { Situacao, TipoCartao } from '@/types';

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
