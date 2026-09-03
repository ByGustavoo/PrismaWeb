import { Banknote, Landmark, PiggyBank, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeTone } from '@/components/ui';
import type { AccountStatus, AccountType } from '@/types';

/**
 * Como cada tipo e cada situacao de conta aparecem na tela. Ficam aqui pelo
 * mesmo motivo de `transactions/meta.ts`: o cadastro, os avisos e qualquer tela
 * futura precisam desenhar a mesma conta do mesmo jeito.
 */
export const accountTypeIcon: Record<AccountType, LucideIcon> = {
  checking: Landmark,
  salary: Banknote,
  emergency: PiggyBank,
  other: Wallet,
};

/**
 * Conta inativa fica neutra, e nao vermelha: ela nao e um problema a resolver,
 * e uma decisao ja tomada por quem encerrou a conta.
 */
export const accountStatusTone: Record<AccountStatus, BadgeTone> = {
  active: 'positive',
  inactive: 'neutral',
};
