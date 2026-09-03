import type { Card, CardStatus, CardType, InstallmentStatus, InvoiceStatus } from '@/types';

export const cardTypeLabel: Record<CardType, string> = {
  credit: 'Cartão de crédito',
  debit: 'Cartão de débito',
  'food-voucher': 'Vale-alimentação',
  'meal-voucher': 'Vale-refeição',
};

/** Rotulo curto, para caber num badge ao lado do nome do cartao. */
export const cardTypeShortLabel: Record<CardType, string> = {
  credit: 'Crédito',
  debit: 'Débito',
  'food-voucher': 'Alimentação',
  'meal-voucher': 'Refeição',
};

/** Ordem em que os tipos aparecem no formulario. */
export const cardTypes: CardType[] = ['credit', 'debit', 'food-voucher', 'meal-voucher'];

export const cardStatusLabel: Record<CardStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
};

export const cardStatuses: CardStatus[] = ['active', 'inactive'];

/** Cartao de credito com os campos que so ele tem, ja garantidos pelo tipo. */
export type CreditCard = Card & {
  type: 'credit';
  limit: number;
  closingDay: number;
  dueDay: number;
};

/**
 * Guarda de tipo em vez de `card.limit!`: os campos de credito sao opcionais no
 * cadastro unico de cartoes, e um vale-refeicao nunca tera limite nem datas de
 * fatura. Quem quiser ler esses campos passa por aqui.
 */
export function isCreditCard(card: Card): card is CreditCard {
  return (
    card.type === 'credit' &&
    typeof card.limit === 'number' &&
    typeof card.closingDay === 'number' &&
    typeof card.dueDay === 'number'
  );
}

/** Vale carrega saldo proprio; credito e debito, nao. */
export function isVoucherCard(card: Card): boolean {
  return card.type === 'food-voucher' || card.type === 'meal-voucher';
}

/**
 * Faixas de uso do limite. Sao os mesmos numeros que decidem o aviso do sino e
 * a cor da barra na tela de cartoes: separados, um dia a barra ficaria ambar
 * sem que nenhum aviso aparecesse.
 */
export const CARD_LIMIT_WARNING_RATIO = 0.7;
export const CARD_LIMIT_CRITICAL_RATIO = 0.9;

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  future: 'Prevista',
  open: 'Aberta',
  closed: 'Fechada',
  paid: 'Paga',
  overdue: 'Vencida',
};

export const installmentStatusLabel: Record<InstallmentStatus, string> = {
  paid: 'Paga',
  current: 'Atual',
  upcoming: 'A vencer',
};

/**
 * Parcelamentos oferecidos no formulario. Sao os que aparecem numa maquininha
 * de verdade: de 2 a 12 seguidos e, depois, so os saltos usuais ate 24.
 */
export const installmentCounts: number[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24,
];
