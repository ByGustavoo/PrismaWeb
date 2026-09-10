import { CreditCard, ShoppingBasket, Utensils, WalletCards } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeTone, ProgressTone } from '@/components/ui';
import { CARD_LIMIT_CRITICAL_RATIO, CARD_LIMIT_WARNING_RATIO } from '@/constants/cards';
import type { CardStatus, CardType, InstallmentStatus, SituacaoFatura } from '@/types';

export const cardTypeIcon: Record<CardType, LucideIcon> = {
  CREDITO: CreditCard,
  DEBITO: WalletCards,
  'VALE_ALIMENTACAO': ShoppingBasket,
  'VALE_REFEICAO': Utensils,
};

export const cardStatusTone: Record<CardStatus, BadgeTone> = {
  ATIVO: 'positive',
  INATIVO: 'neutral',
};

export function limitTone(ratio: number): ProgressTone {
  if (ratio >= CARD_LIMIT_CRITICAL_RATIO) return 'negative';
  if (ratio >= CARD_LIMIT_WARNING_RATIO) return 'warning';
  return 'accent';
}

export const invoiceStatusTone: Record<SituacaoFatura, BadgeTone> = {
  FUTURA: 'neutral',
  ABERTA: 'accent',
  FECHADA: 'warning',
  PAGA: 'positive',
  VENCIDA: 'negative',
};

export const installmentStatusTone: Record<InstallmentStatus, BadgeTone> = {
  PAGA: 'positive',
  ATUAL: 'accent',
  FUTURA: 'neutral',
};
