import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeTone } from '@/components/ui';
import type { AmountTone } from '@/components/common';
import type { TipoLancamento, SituacaoLancamento } from '@/types';

/**
 * Como cada tipo e cada situacao aparecem na tela. Ficam aqui para que o
 * dashboard e a listagem de lancamentos nunca divirjam no icone ou na cor.
 */

export const kindIcon: Record<TipoLancamento, LucideIcon> = {
  RECEITA: ArrowUpRight,
  DESPESA: ArrowDownLeft,
  TRANSFERENCIA: Repeat,
};

/**
 * Transferencia fica neutra: ela nao soma nem subtrai do resultado, entao
 * pintar de verde ou vermelho mentiria sobre o efeito no saldo.
 */
export const kindTone: Record<TipoLancamento, AmountTone> = {
  RECEITA: 'positive',
  DESPESA: 'negative',
  TRANSFERENCIA: 'muted',
};

export const kindSign: Record<TipoLancamento, 'plus' | 'minus' | 'none'> = {
  RECEITA: 'plus',
  DESPESA: 'minus',
  TRANSFERENCIA: 'none',
};

/*
 * Hierarquia visual das situacoes: verde para o que ja aconteceu, ambar para o
 * que exige atencao e azul para o que esta apenas programado. Todas usam ponto
 * para que a leitura nao dependa so da cor.
 */
export const statusTone: Record<SituacaoLancamento, BadgeTone> = {
  PAGO: 'positive',
  PENDENTE: 'warning',
  AGENDADO: 'accent',
};
