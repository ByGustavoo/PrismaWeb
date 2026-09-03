import type { AccountStatus, AccountType } from '@/types';

/**
 * Rotulos de dominio das contas, num lugar so, para que o formulario, o
 * cadastro e os filtros nunca escrevam o mesmo tipo de duas formas.
 */
export const accountTypeLabel: Record<AccountType, string> = {
  checking: 'Conta corrente',
  salary: 'Conta salário',
  emergency: 'Reserva de emergência',
  other: 'Outros',
};

/** Ordem em que os tipos aparecem no formulario e nos agrupamentos. */
export const accountTypes: AccountType[] = ['checking', 'salary', 'emergency', 'other'];

export const accountStatusLabel: Record<AccountStatus, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
};

export const accountStatuses: AccountStatus[] = ['active', 'inactive'];
