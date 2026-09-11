export const caminhos = {
  dashboard: '/dashboard',

  lancamentos: '/lancamentos',
  receitas: '/lancamentos/receitas',
  despesas: '/lancamentos/despesas',
  transferencias: '/lancamentos/transferencias',

  contas: '/contas',
  cartoes: '/cartoes',
  faturas: '/faturas',
  parcelamentos: '/parcelamentos',

  investimentos: '/investimentos',

  orcamento: '/planejamento/orcamento',
  recorrentes: '/planejamento/recorrentes',
  previsao: '/planejamento/previsao',
  metas: '/planejamento/metas',

  relatorios: '/relatorios',
  configuracoes: '/configuracoes',
} as const;

export const PARAMETRO_NOVO_LANCAMENTO = 'novo';

export const valoresNovoLancamento = {
  receita: 'RECEITA',
  despesa: 'DESPESA',
  transferencia: 'TRANSFERENCIA',
} as const;

export const PARAMETRO_BUSCA = 'busca';
export const PARAMETRO_CATEGORIA = 'categoria';
export const PARAMETRO_CONTA = 'conta';
export const PARAMETRO_EDITAR_LANCAMENTO = 'editar';

export const PARAMETRO_CARTAO = 'cartao';
