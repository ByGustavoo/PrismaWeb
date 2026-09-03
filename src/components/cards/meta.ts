import { CreditCard, ShoppingBasket, Utensils, WalletCards } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeTone, ProgressTone } from '@/components/ui';
import { CARD_LIMIT_CRITICAL_RATIO, CARD_LIMIT_WARNING_RATIO } from '@/constants/cards';
import type { CardStatus, CardType, InstallmentStatus, InvoiceStatus } from '@/types';

export const cardTypeIcon: Record<CardType, LucideIcon> = {
  credit: CreditCard,
  debit: WalletCards,
  'food-voucher': ShoppingBasket,
  'meal-voucher': Utensils,
};

export const cardStatusTone: Record<CardStatus, BadgeTone> = {
  active: 'positive',
  inactive: 'neutral',
};

/**
 * Cor da barra de limite. Usa as mesmas faixas do aviso do sino, entao a barra
 * so fica ambar quando existe um aviso correspondente no painel.
 */
export function limitTone(ratio: number): ProgressTone {
  if (ratio >= CARD_LIMIT_CRITICAL_RATIO) return 'negative';
  if (ratio >= CARD_LIMIT_WARNING_RATIO) return 'warning';
  return 'accent';
}

/**
 * Fatura prevista fica neutra: ela ainda nao pede nada de ninguem. A aberta usa
 * o acento por ser a que esta em curso, a fechada pede atencao porque tem
 * pagamento a fazer, e a vencida e o unico caso vermelho.
 */
export const invoiceStatusTone: Record<InvoiceStatus, BadgeTone> = {
  future: 'neutral',
  open: 'accent',
  closed: 'warning',
  paid: 'positive',
  overdue: 'negative',
};

export const installmentStatusTone: Record<InstallmentStatus, BadgeTone> = {
  paid: 'positive',
  current: 'accent',
  upcoming: 'neutral',
};
