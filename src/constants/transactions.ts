import type { PaymentMethod, TransactionKind, TransactionStatus } from '@/types';

/**
 * Rotulos de dominio compartilhados entre a tabela e os filtros.
 * Ficam num lugar so para que a mesma situacao nunca apareca escrita de duas
 * formas diferentes em telas diferentes.
 */
export const transactionStatusLabel: Record<TransactionStatus, string> = {
  PAGO: 'Concluído',
  PENDENTE: 'Pendente',
  AGENDADO: 'Agendado',
};

export const transactionKindLabel: Record<TransactionKind, string> = {
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
  TRANSFERENCIA: 'Transferência',
};

/** Rotulo no plural, usado nos filtros e nos titulos de tela. */
export const transactionKindPluralLabel: Record<TransactionKind, string> = {
  RECEITA: 'Receitas',
  DESPESA: 'Despesas',
  TRANSFERENCIA: 'Transferências',
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CONTA: 'Débito em conta',
  'CARTAO_CREDITO': 'Cartão de crédito',
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
};

/** Ordem em que as formas de pagamento aparecem no formulario. */
export const paymentMethods: PaymentMethod[] = ['CONTA', 'PIX', 'CARTAO_CREDITO', 'DINHEIRO'];

export const transactionStatuses: TransactionStatus[] = ['PAGO', 'PENDENTE', 'AGENDADO'];
