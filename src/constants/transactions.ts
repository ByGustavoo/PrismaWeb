import type { FormaPagamento, TipoLancamento, SituacaoLancamento } from '@/types';

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

export const paymentMethods: FormaPagamento[] = ['CONTA', 'PIX', 'CARTAO_CREDITO', 'DINHEIRO'];

export const transactionStatuses: SituacaoLancamento[] = ['PAGO', 'PENDENTE', 'AGENDADO'];
