import type { AccountStatus, AccountType } from '@/types';

/**
 * Rotulos de dominio das contas, num lugar so, para que o formulario, o
 * cadastro e os filtros nunca escrevam o mesmo tipo de duas formas.
 */
export const accountTypeLabel: Record<AccountType, string> = {
  CORRENTE: 'Conta corrente',
  SALARIO: 'Conta salário',
  EMERGENCIA: 'Reserva de emergência',
  OUTRA: 'Outros',
};

/** Ordem em que os tipos aparecem no formulario e nos agrupamentos. */
export const accountTypes: AccountType[] = ['CORRENTE', 'SALARIO', 'EMERGENCIA', 'OUTRA'];

export const accountStatusLabel: Record<AccountStatus, string> = {
  ATIVO: 'Ativa',
  INATIVO: 'Inativa',
};

export const accountStatuses: AccountStatus[] = ['ATIVO', 'INATIVO'];
