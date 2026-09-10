import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeTone } from '@/components/ui';
import type { AmountTone } from '@/components/common';
import type { TipoLancamento, SituacaoLancamento } from '@/types';

export const kindIcon: Record<TipoLancamento, LucideIcon> = {
  RECEITA: ArrowUpRight,
  DESPESA: ArrowDownLeft,
  TRANSFERENCIA: Repeat,
};

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

export const statusTone: Record<SituacaoLancamento, BadgeTone> = {
  PAGO: 'positive',
  PENDENTE: 'warning',
  AGENDADO: 'accent',
};
