import type { TransactionKind, TransactionStatus } from '@/types';

/**
 * Rotulos de dominio compartilhados entre a tabela e os filtros.
 * Ficam num lugar so para que a mesma situacao nunca apareca escrita de duas
 * formas diferentes em telas diferentes.
 */
export const transactionStatusLabel: Record<TransactionStatus, string> = {
  paid: 'Concluído',
  pending: 'Pendente',
  scheduled: 'Agendado',
};

export const transactionKindLabel: Record<TransactionKind, string> = {
  income: 'Receita',
  expense: 'Despesa',
  transfer: 'Transferência',
};

/** Rotulo no plural, usado nos filtros e nos titulos de tela. */
export const transactionKindPluralLabel: Record<TransactionKind, string> = {
  income: 'Receitas',
  expense: 'Despesas',
  transfer: 'Transferências',
};
