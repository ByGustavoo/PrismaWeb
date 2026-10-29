import type { FormaLancamento, SituacaoLancamento, Tendencia, TipoLancamento } from '@/types';

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

export const NOTA_PAGAMENTO_PARCELA = 'Gerada pelo pagamento da parcela';

export function legendaVariacaoGasto(tendencia: Tendencia, substantivoPeriodo?: string): string | undefined {
  if (!substantivoPeriodo) {
    if (tendencia === 'ALTA') return 'gastou mais';
    if (tendencia === 'BAIXA') return 'gastou menos';
    return undefined;
  }
  if (tendencia === 'ALTA') return `a mais que no ${substantivoPeriodo} anterior`;
  if (tendencia === 'BAIXA') return `a menos que no ${substantivoPeriodo} anterior`;
  return `em relação ao ${substantivoPeriodo} anterior`;
}

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
