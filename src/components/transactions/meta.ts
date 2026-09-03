import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeTone } from '@/components/ui';
import type { AmountTone } from '@/components/common';
import type { TransactionKind, TransactionStatus } from '@/types';

/**
 * Como cada tipo e cada situacao aparecem na tela. Ficam aqui para que o
 * dashboard e a listagem de lancamentos nunca divirjam no icone ou na cor.
 */

export const kindIcon: Record<TransactionKind, LucideIcon> = {
  income: ArrowUpRight,
  expense: ArrowDownLeft,
  transfer: Repeat,
};

/**
 * Transferencia fica neutra: ela nao soma nem subtrai do resultado, entao
 * pintar de verde ou vermelho mentiria sobre o efeito no saldo.
 */
export const kindTone: Record<TransactionKind, AmountTone> = {
  income: 'positive',
  expense: 'negative',
  transfer: 'muted',
};

export const kindSign: Record<TransactionKind, 'plus' | 'minus' | 'none'> = {
  income: 'plus',
  expense: 'minus',
  transfer: 'none',
};

/*
 * Hierarquia visual das situacoes: verde para o que ja aconteceu, ambar para o
 * que exige atencao e azul para o que esta apenas programado. Todas usam ponto
 * para que a leitura nao dependa so da cor.
 */
export const statusTone: Record<TransactionStatus, BadgeTone> = {
  paid: 'positive',
  pending: 'warning',
  scheduled: 'accent',
};
