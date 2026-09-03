import type { PaymentMethod, TransactionKind, TransactionStatus } from '@/types';

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

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  account: 'Débito em conta',
  'credit-card': 'Cartão de crédito',
  pix: 'Pix',
  cash: 'Dinheiro',
};

/** Ordem em que as formas de pagamento aparecem no formulario. */
export const paymentMethods: PaymentMethod[] = ['account', 'pix', 'credit-card', 'cash'];

export const transactionStatuses: TransactionStatus[] = ['paid', 'pending', 'scheduled'];
