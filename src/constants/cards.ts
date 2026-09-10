import type { Card, CardStatus, CardType, InstallmentStatus, SituacaoFatura } from '@/types';

export const cardTypeLabel: Record<CardType, string> = {
  CREDITO: 'Cartão de crédito',
  DEBITO: 'Cartão de débito',
  'VALE_ALIMENTACAO': 'Vale-alimentação',
  'VALE_REFEICAO': 'Vale-refeição',
};

export const cardTypeShortLabel: Record<CardType, string> = {
  CREDITO: 'Crédito',
  DEBITO: 'Débito',
  'VALE_ALIMENTACAO': 'Alimentação',
  'VALE_REFEICAO': 'Refeição',
};

export const cardTypes: CardType[] = ['CREDITO', 'DEBITO', 'VALE_ALIMENTACAO', 'VALE_REFEICAO'];

export const cardStatusLabel: Record<CardStatus, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
};

export const cardStatuses: CardStatus[] = ['ATIVO', 'INATIVO'];

export type CreditCard = Card & {
  type: 'CREDITO';
  limit: number;
  closingDay: number;
  dueDay: number;
};

export function isCreditCard(card: Card): card is CreditCard {
  return (
    card.type === 'CREDITO' &&
    typeof card.limit === 'number' &&
    typeof card.closingDay === 'number' &&
    typeof card.dueDay === 'number'
  );
}

export function isVoucherCard(card: Card): boolean {
  return card.type === 'VALE_ALIMENTACAO' || card.type === 'VALE_REFEICAO';
}

export const CARD_LIMIT_WARNING_RATIO = 0.7;
export const CARD_LIMIT_CRITICAL_RATIO = 0.9;

export const invoiceStatusLabel: Record<SituacaoFatura, string> = {
  FUTURA: 'Prevista',
  ABERTA: 'Aberta',
  FECHADA: 'Fechada',
  PAGA: 'Paga',
  VENCIDA: 'Vencida',
};

export const installmentStatusLabel: Record<InstallmentStatus, string> = {
  PAGA: 'Paga',
  ATUAL: 'Atual',
  FUTURA: 'A vencer',
};

export const installmentCounts: number[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24,
];
