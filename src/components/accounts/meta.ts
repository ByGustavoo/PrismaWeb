import { Banknote, Landmark, PiggyBank, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeTone } from '@/components/ui';
import type { AccountStatus, AccountType } from '@/types';

export const accountTypeIcon: Record<AccountType, LucideIcon> = {
  CORRENTE: Landmark,
  SALARIO: Banknote,
  EMERGENCIA: PiggyBank,
  OUTRA: Wallet,
};

export const accountStatusTone: Record<AccountStatus, BadgeTone> = {
  ATIVO: 'positive',
  INATIVO: 'neutral',
};
