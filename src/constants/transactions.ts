import type { FormaPagamento, TipoLancamento, SituacaoLancamento } from '@/types';

/**
 * Rotulos de dominio compartilhados entre a tabela e os filtros.
 * Ficam num lugar so para que a mesma situacao nunca apareca escrita de duas
 * formas diferentes em telas diferentes.
 */
export const transactionStatusLabel: Record<SituacaoLancamento, string> = {
  PAGO: 'Concluído',
  PENDENTE: 'Pendente',
  AGENDADO: 'Agendado',
};

export const transactionKindLabel: Record<TipoLancamento, string> = {
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
  TRANSFERENCIA: 'Transferência',
};

/** Rotulo no plural, usado nos filtros e nos titulos de tela. */
export const transactionKindPluralLabel: Record<TipoLancamento, string> = {
  RECEITA: 'Receitas',
  DESPESA: 'Despesas',
  TRANSFERENCIA: 'Transferências',
};

export const paymentMethodLabel: Record<FormaPagamento, string> = {
  CONTA: 'Débito em conta',
  'CARTAO_CREDITO': 'Cartão de crédito',
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
};

/** Ordem em que as formas de pagamento aparecem no formulario. */
export const paymentMethods: FormaPagamento[] = ['CONTA', 'PIX', 'CARTAO_CREDITO', 'DINHEIRO'];

export const transactionStatuses: SituacaoLancamento[] = ['PAGO', 'PENDENTE', 'AGENDADO'];
