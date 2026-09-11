import { Banknote, Landmark, PiggyBank, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TomSelo } from '@/components/ui';
import type { Situacao, TipoConta } from '@/types';

export const iconeTipoConta: Record<TipoConta, LucideIcon> = {
  CORRENTE: Landmark,
  SALARIO: Banknote,
  EMERGENCIA: PiggyBank,
  OUTRA: Wallet,
};

export const tomSituacaoConta: Record<Situacao, TomSelo> = {
  ATIVO: 'positive',
  INATIVO: 'neutral',
};
