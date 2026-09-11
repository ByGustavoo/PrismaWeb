import type { FormaLancamento, SituacaoLancamento, TipoLancamento } from '@/types';

export const rotuloSituacaoLancamento: Record<SituacaoLancamento, string> = {
  PAGO: 'Concluído',
  PENDENTE: 'Pendente',
  AGENDADO: 'Agendado',
};

export const rotuloTipoLancamento: Record<TipoLancamento, string> = {
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
  TRANSFERENCIA: 'Transferência',
};

export const rotuloPluralTipoLancamento: Record<TipoLancamento, string> = {
  RECEITA: 'Receitas',
  DESPESA: 'Despesas',
  TRANSFERENCIA: 'Transferências',
};

export const rotuloFormaLancamento: Record<FormaLancamento, string> = {
  CONTA: 'Débito em conta',
  'CARTAO_CREDITO': 'Cartão de crédito',
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
};

export const formasLancamento: FormaLancamento[] = ['CONTA', 'PIX', 'CARTAO_CREDITO', 'DINHEIRO'];

export const situacoesLancamento: SituacaoLancamento[] = ['PAGO', 'PENDENTE', 'AGENDADO'];
