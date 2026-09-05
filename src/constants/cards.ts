import type { Card, CardStatus, CardType, InstallmentStatus, SituacaoFatura } from '@/types';

export const cardTypeLabel: Record<CardType, string> = {
  CREDITO: 'Cartão de crédito',
  DEBITO: 'Cartão de débito',
  'VALE_ALIMENTACAO': 'Vale-alimentação',
  'VALE_REFEICAO': 'Vale-refeição',
};

/** Rotulo curto, para caber num badge ao lado do nome do cartao. */
export const cardTypeShortLabel: Record<CardType, string> = {
  CREDITO: 'Crédito',
  DEBITO: 'Débito',
  'VALE_ALIMENTACAO': 'Alimentação',
  'VALE_REFEICAO': 'Refeição',
};

/** Ordem em que os tipos aparecem no formulario. */
export const cardTypes: CardType[] = ['CREDITO', 'DEBITO', 'VALE_ALIMENTACAO', 'VALE_REFEICAO'];

export const cardStatusLabel: Record<CardStatus, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
};

export const cardStatuses: CardStatus[] = ['ATIVO', 'INATIVO'];

/** Cartao de credito com os campos que so ele tem, ja garantidos pelo tipo. */
export type CreditCard = Card & {
  type: 'CREDITO';
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
    card.type === 'CREDITO' &&
    typeof card.limit === 'number' &&
    typeof card.closingDay === 'number' &&
    typeof card.dueDay === 'number'
  );
}

/** Vale carrega saldo proprio; credito e debito, nao. */
export function isVoucherCard(card: Card): boolean {
  return card.type === 'VALE_ALIMENTACAO' || card.type === 'VALE_REFEICAO';
}

/**
 * Faixas de uso do limite. Sao os mesmos numeros que decidem o aviso do sino e
 * a cor da barra na tela de cartoes: separados, um dia a barra ficaria ambar
 * sem que nenhum aviso aparecesse.
 */
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

/**
 * Parcelamentos oferecidos no formulario. Sao os que aparecem numa maquininha
 * de verdade: de 2 a 12 seguidos e, depois, so os saltos usuais ate 24.
 */
export const installmentCounts: number[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24,
];
