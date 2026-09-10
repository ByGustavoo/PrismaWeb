import type { AccountStatus, AccountType } from '@/types';

export const accountTypeLabel: Record<AccountType, string> = {
  CORRENTE: 'Conta corrente',
  SALARIO: 'Conta salário',
  EMERGENCIA: 'Reserva de emergência',
  OUTRA: 'Outros',
};

export const accountTypes: AccountType[] = ['CORRENTE', 'SALARIO', 'EMERGENCIA', 'OUTRA'];

export const accountStatusLabel: Record<AccountStatus, string> = {
  ATIVO: 'Ativa',
  INATIVO: 'Inativa',
};

export const accountStatuses: AccountStatus[] = ['ATIVO', 'INATIVO'];
