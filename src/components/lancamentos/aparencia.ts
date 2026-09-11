import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TomSelo } from '@/components/ui';
import type { TomValorMonetario } from '@/components/comum';
import type { SituacaoLancamento, TipoLancamento } from '@/types';

export const iconePorTipo: Record<TipoLancamento, LucideIcon> = {
  RECEITA: ArrowUpRight,
  DESPESA: ArrowDownLeft,
  TRANSFERENCIA: Repeat,
};

export const classePorTipo: Record<TipoLancamento, string> = {
  RECEITA: 'income',
  DESPESA: 'expense',
  TRANSFERENCIA: 'transfer',
};

export const tomPorTipo: Record<TipoLancamento, TomValorMonetario> = {
  RECEITA: 'positive',
  DESPESA: 'negative',
  TRANSFERENCIA: 'muted',
};

export const sinalPorTipo: Record<TipoLancamento, 'plus' | 'minus' | 'none'> = {
  RECEITA: 'plus',
  DESPESA: 'minus',
  TRANSFERENCIA: 'none',
};

export const tomPorSituacao: Record<SituacaoLancamento, TomSelo> = {
  PAGO: 'positive',
  PENDENTE: 'warning',
  AGENDADO: 'accent',
};
